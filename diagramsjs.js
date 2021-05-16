// https://diagrams.mingrammer.com/docs/getting-started/examples#rabbitmq-consumers-with-custom-nodes

var diagramsjs = (function() {
	
	function uuid() {
	  return 'yxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
	
	function toAttrs(obj) {
		return '[' + Object.keys(obj).map(function(k){ return `${k}="${obj[k]}"`; }).join(", ") + ']';
	}
	
	function tabs(count) {
		var tabs = [];
		for (var i = 0; i < count; i++) {
			tabs.push('\t');
		}
		return tabs.join('');
	}
	
	function mergeAttrs(src, target) {
		var attrs = {};
		Object.assign(attrs, src);
		Object.assign(attrs, target);
		return attrs;
	}
	
	function getFromUrl(yourUrl){
		var httpreq = new XMLHttpRequest(); // a new request
		httpreq.open("GET",yourUrl,false);
		httpreq.send(null);
		return httpreq.responseText;          
	}
	
	////////////////////////////////////////////////////////////
	
	// image urls of Node
	var icons = {};
	
	var context = {
		_defaultAttrs_: {
			digraph: {
				fontcolor: "#2D3436",
				fontname: "Sans-Serif",
				fontsize: "15",
				nodesep: "0.60",
				pad: "2.0",
				ranksep: "0.75",
				splines: "ortho",
				
				rankdir: "LR",
			},
			node: {
				shape: "box",
				style: "rounded",
				fixedsize: true,
				width: "1.4",
				height: "1.9",
				labelloc: "b",
				// imagepos attribute is not backward compatible
				// TODO: check graphviz version to see if "imagepos" is available >= 2.40
				// https://github.com/xflr6/graphviz/blob/master/graphviz/backend.py#L248
				// "imagepos": "tc",
				imagescale: true,
				fontname: "Sans-Serif",
				fontsize: "13",
				fontcolor: "#2D3436",
				shape: "none",
			},
			edge: {
				color: "#7B8894"
			},
			subgraph: {
				shape: "box",
				style: "rounded",
				labeljust: "l",
				pencolor: "#AEB6BE",
				fontname: "Sans-Serif",
				fontsize: "12",
				
				bgcolor: "#E5F5FD",
				rankdir: "LR",
			},
			subgraphBgcolors: ["#E5F5FD", "#EBF3E7", "#ECE8F6", "#FDF7E3"]
		},
		
		_root_: null,
		_queue_: [],
		_current_: null,
		_allNodes_: {},	// To determine if it has been created at least once per uuid
		_edges_: {},
		
		reset: function() {
			this._root_ = null;
			this._queue_ = [];
			this._current_ = null;
			this._allNodes_ = {};
			this._edges_ = {};
		},
		
		addNode: function(node) {
			if (this._allNodes_[node.uuid] == null) {
				this._current_[node.uuid] = node;
				this._allNodes_[node.uuid] = node;
			}
		},
		
		addEdge: function(startNode, endNode, direct, attrs) {	//	direct: none, forward, back
			attrs = attrs || {};
			attrs.dir = direct;
			
			var key = startNode.uuid + '_' + endNode.uuid;
			if (this._edges_[key] == null) {
				this._edges_[key] = {
					startnode: startNode, 
					endnode: endNode, 
					direct: direct,
					attrs: function() {
						return attrs;
					},
				};
			}
		},
		
		diagram_enter: function(diagram) {
			this._root_ = diagram;
			this._current_ = this._root_;
			this._queue_.push(this._current_);
		},
		diagram_exit: function(diagram) {
			this._current_ = this._queue_.splice(-1,1)[0];	// remove last element
		},
		
		cluster_enter: function(cluster) {
			this._current_['cluster_' + cluster.uuid] = cluster;
			this._current_ = cluster;
			this._queue_.push(this._current_);
		},
		cluster_exit: function(cluster) {
			this._queue_.pop();
			this._current_ = this._queue_[this._queue_.length - 1];
		}
	};

	var ctx = new Proxy(context, {
	  get: function(target, prop) {
		if (prop && !prop.startsWith('_') && !prop.endsWith('_')) {
			//console.log({ type: 'get', target, prop });
		}
		return Reflect.get(target, prop);
	  },
	  set: function(target, prop, value) {
		if (prop && !prop.startsWith('_') && !prop.endsWith('_')) {
			//console.log({ type: 'set', target, prop, value });
			if (Array.isArray(value)) {
				value = ArrayGroup(value);
			}
		}
		return Reflect.set(target, prop, value);
	  }
	});
	
	///////////////////////////////////////////////////////////
	
	function connect(me, node, direct) {
		if (Array.isArray(node)) {	// natvie array
			node = ArrayGroup(node);
		}
		
		if (me.type == 'edge') {
			me = me.srcNode;
		}
		
		if (Array.isArray(me)) {
			connectGroup(me, node, direct);
		} else {
			if (node.type == 'edge') {
				var edge = node;
				me.edgeattrs = edge.attrs();
				edge.srcNode = me;
			} else if (node.type == 'array_group') {	// arraygroup
				var nodes = node.nodes;
				for (var i = 0; i < nodes.length; i++) {
					ctx.addNode(nodes[i]);
					ctx.addEdge(me, nodes[i], direct, me.edgeattrs);
				}
			} else {
				ctx.addNode(node);
				ctx.addEdge(me, node, direct, me.edgeattrs);
			}
		}
		return node;
	}
	
	function connectGroup(nodes, node, direct) {
		if (node.type == 'edge') {
			for (var i = 0; i < nodes.length; i++) {
				var edge = node;
				nodes[i].edgeattrs = edge.attrs();
			}
			node.srcNode = nodes;
		} else {
			ctx.addNode(node);
			for (var i = 0; i < nodes.length; i++) {
				ctx.addEdge(nodes[i], node, direct, nodes[i].edgeattrs);
			}
		}
		return node;
	}

	function Node(name, attrs, image) {
		attrs = attrs || {};
		attrs = mergeAttrs(context._defaultAttrs_.node, attrs);
		
		attrs.label = name;
		if (image) {
			icons[image] = true;
			attrs.image = image;
		}
		
		var node = {
			type: 'type',
			uuid: uuid(),
			name: name,
			link: function(node) {		// -
				return connect(this, node, 'none');
			},
			outin: function(node) {	// <<
				return connect(this, node, 'back');
			},
			inout: function(node) {	// >>
				return connect(this, node, 'forward');
			},
			both: function(node) {	// << >>
				return connect(this, node, 'both');
			},
			
			edgeattrs: null,
			attrs: function() {
				return attrs;
			},
		};
		node._ = node.link;			// alias (-)
		node.$_ = node.outin;		// alias (<<) <-
		node._$ = node.inout;		// alias (>>) ->
		node.$_$ = node.both;		// alias (<< >>) <->
		node.left = node.outin;		// alias (<<)
		node.right = node.inout;	// alias (>>)
		
		ctx.addNode(node);
		return node;
	}
	
	function ArrayGroup(nodes) {
		if (!Array.isArray(nodes)) {
			throw new Error('Nodes is not array.');
		}
		
		nodes.forEach(function(element) {
			ctx.addNode(element);
		});
		
		var group = {
			type: 'array_group',
			nodes: nodes,
			uuid: uuid(),
			name: '_array_group_',
			link: function(node) {	// -
				return connectGroup(nodes, node, 'none');
			},
			outin: function(node) {	// <<
				return connectGroup(nodes, node, 'back');
			},
			inout: function(node) {	// >>
				return connectGroup(nodes, node, 'forward');
			},
			both: function(node) {	// << >>
				return connectGroup(nodes, node, 'both');
			},
			push: function(val) {
				this.nodes.push(val);
			}
		};
		group._ = group.link;		// alias (-)
		group.$_ = group.outin;		// alias (<<) <-
		group._$ = group.inout;		// alias (>>) ->
		group.$_$ = group.both;	// alias (<< >>) <->
		group.left = group.outin;	// alias (<<)
		group.right = group.inout;	// alias (>>)
		return group;
	}
	
	function Edge(attrs) {
		attrs = attrs || {};
		attrs = mergeAttrs(context._defaultAttrs_.edge, attrs);
		
		var node = {
			type: 'edge',
			uuid: uuid(),
			name: '_edge_',
			link: function(node) {		// -
				return connect(this, node, 'none');
			},
			outin: function(node) {	// <<
				return connect(this, node, 'back');
			},
			inout: function(node) {	// >>
				return connect(this, node, 'forward');
			},
			both: function(node) {	// << >>
				return connect(this, node, 'both');
			},
			
			attrs: function() {
				return attrs;
			},
		};
		node._ = node.link;			// alias (-)
		node.$_ = node.outin;		// alias (<<) <-
		node._$ = node.inout;		// alias (>>) ->
		node.$_$ = node.both;		// alias (<< >>) <->
		node.left = node.outin;		// alias (<<)
		node.right = node.inout;	// alias (>>)
		return node;
	}

	function Cluster(name, callbackFunc, attrs) {
		attrs = attrs || {};
		attrs = mergeAttrs(context._defaultAttrs_.subgraph, attrs);
		attrs.label = name;
		
		var cluster = {
			type: 'cluster',
			uuid: uuid(),
			name: name,
			
			attrs: function() {
				return attrs;
			},
		};
		ctx.cluster_enter(cluster);
		callbackFunc.call(ctx, cluster);
		ctx.cluster_exit(cluster);
		return cluster;
	}

	function Diagram(name, callbackFunc, attrs) {
		attrs = attrs || {};
		attrs = mergeAttrs(context._defaultAttrs_.digraph, attrs);
		
		var diagram = {
			type: 'diagram',
			name: name,
			
			attrs: function() {
				return attrs;
			},
		}
		ctx.diagram_enter(diagram);
		callbackFunc.call(ctx, diagram);
		ctx.diagram_exit(diagram);
		return diagram;
	}


	///////////////////////////////////////////////////
	
	
	function generate(expr) {
		context.reset();
		eval(expr);
		var viz = generateScript();
		return viz;
	}
	
	function generateScript() {
		var root = context._root_;
		
		var lines = [];
		lines.push(`digraph "${context._root_.name}" {`);
		lines.push(`	graph ${toAttrs(context._root_.attrs())}`);
		lines.push(`	node ${toAttrs(context._defaultAttrs_.node)}`);
		lines.push(`	edge ${toAttrs(context._defaultAttrs_.edge)}`);
		lines.push(``);
		
		generateScriptNode(lines, root, 1);
		
		lines.push(``);
		
		generateScriptEdge(lines, context._edges_);
		
		lines.push(`}`);
		return lines.join('\n');
	}
	
	function generateScriptNode(lines, parent, depth) {
		var tab = tabs(depth);
		for (var key in parent){
			var node = parent[key];
			if (node && node.type) {
				if (node.type == 'cluster') {
					lines.push(`${tab}subgraph "cluster_${node.name}" {`);
					var attrs = node.attrs();
					attrs.bgcolor = context._defaultAttrs_.subgraphBgcolors[depth - 1];
					lines.push(`${tabs(depth + 1)}graph ${toAttrs(attrs)}`);
					generateScriptNode(lines, node, depth + 1);
					lines.push(`${tab}}`);
				} else {
					lines.push(`${tab}"${key}" ${toAttrs(node.attrs())}`);
				}
			}
		}
	}
	
	function generateScriptEdge(lines, edges) {
		for (var key in edges){
			var edge = edges[key];
			//var edgeattrs = ctx._allNodes_[edge.startnode.uuid] ? ;
			lines.push(`	"${edge.startnode.uuid}" -> "${edge.endnode.uuid}" ${toAttrs(edge.attrs())}`);
		}
	}
	
	function predefineNodes(dir, namespace) {
		function redefineNode(dir, namespace, key) {
			var image = namespace[key];
			image = dir ? dir + image : image;
			namespace[key] = function() {
				var args = [];
				args[0] = arguments[0];
				args[1] = arguments[1];
				args[2] = image;
				var node = Node.apply(null, args);
				return node;
			}
		}
		
		for (var key in namespace) {
			if (!namespace[key] || typeof namespace[key] == "function") {
				continue;
			}
			redefineNode(dir, namespace, key);
		}
	}
	
	function render(selectorOrObj, code, options, cbFunc) {
		if (!code || code.trim().length == 0) {
			throw new Error("Code for rendering is null or empty.");
		}
		
		// engine: circo, dot (default), fdp, neato, osage, patchwork, twopi
		var defaultVizOptions = {width: "100%", height: "100%", fit: true, engine: "dot"};
		options = options || {};
		options = mergeAttrs(defaultVizOptions, options);
		
		cbFunc = cbFunc || function(){};
		
		var vizScript = generate(code);

		var graphviz = d3.select(selectorOrObj).graphviz(options);

		Object.entries(icons).forEach(([key, value]) => {
			graphviz.addImage(key, "50px", "50px");
		});
		
		graphviz.renderDot(vizScript, function() {
			cbFunc();
		});
	}
	
	///////////////////////////////////////////////////

	var diagrams = {};	// Preset namespace variables to be used in scripts
	
	if (diagramsjs_resources) {
		var baseUrl = diagramsjs_resources.baseUrl || "https://github.com/mingrammer/diagrams/raw/master/resources";
		for (var x in diagramsjs_resources) {
			if (x == 'baseUrl') continue;
			
			diagrams[x] = diagramsjs_resources[x];
			for (var y in diagramsjs_resources[x]) {
				var dir = `${baseUrl}/${x}/${y}/`
				predefineNodes(dir, diagramsjs_resources[x][y]);
			}
		}
	}
	
	///////////////////////////////////////////////////
	
	return {
		generate: generate,
		render: render
	};
})();
