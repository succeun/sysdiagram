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
	
	var defaultAttrs = {
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
	};

	var rootNode = null;
	var nodeQueue = [];
	var currentNode = null;
	var allNodes = {};	// To determine if it has been created at least once per uuid
	var edges = {};
	
	var icons = {};	// image urls of Node
	
	function reset() {
		rootNode = null;
		nodeQueue = [];
		currentNode = null;
		allNodes = {};
		edges = {};
	}
	
	function addNode(node) {
		if (allNodes[node.uuid] == null) {
			currentNode[node.uuid] = node;
			allNodes[node.uuid] = node;
		}
	}
	
	function addEdge(startNode, endNode, direct, attrs) {	//	direct: none, forward, back
		attrs = attrs || {};
		attrs.dir = direct;
		
		var key = startNode.uuid + '_' + endNode.uuid;
		if (edges[key] == null) {
			edges[key] = {
				startnode: startNode, 
				endnode: endNode, 
				direct: direct,
				attrs: function() {
					return attrs;
				},
			};
		}
	}
	
	function diagram_enter(diagram) {
		rootNode = diagram;
		currentNode = rootNode;
		nodeQueue.push(currentNode);
	}
	
	function diagram_exit(diagram) {
		currentNode = nodeQueue.splice(-1,1)[0];	// remove last element
	}
	
	function cluster_enter(cluster) {
		currentNode['cluster_' + cluster.uuid] = cluster;
		currentNode = cluster;
		nodeQueue.push(currentNode);
	}
	
	function cluster_exit(cluster) {
		nodeQueue.pop();
		currentNode = nodeQueue[nodeQueue.length - 1];
	}
	
	var context = { };	// Storing variables in scripts

	var ctx = new Proxy(context, {
	  get: function(target, prop) {
		return Reflect.get(target, prop);
	  },
	  set: function(target, prop, value) {
		if (prop) {
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
					addNode(nodes[i]);
					addEdge(me, nodes[i], direct, me.edgeattrs);
				}
			} else {
				addNode(node);
				addEdge(me, node, direct, me.edgeattrs);
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
			addNode(node);
			for (var i = 0; i < nodes.length; i++) {
				addEdge(nodes[i], node, direct, nodes[i].edgeattrs);
			}
		}
		return node;
	}

	function Node(name, attrs, image) {
		attrs = attrs || {};
		attrs = mergeAttrs(defaultAttrs.node, attrs);
		
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
		
		addNode(node);
		return node;
	}
	
	function ArrayGroup(nodes) {
		if (!Array.isArray(nodes)) {
			throw new Error('Nodes is not array.');
		}
		
		nodes.forEach(function(element) {
			addNode(element);
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
		attrs = mergeAttrs(defaultAttrs.edge, attrs);
		
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
		attrs = mergeAttrs(defaultAttrs.subgraph, attrs);
		attrs.label = name;
		
		var cluster = {
			type: 'cluster',
			uuid: uuid(),
			name: name,
			
			attrs: function() {
				return attrs;
			},
		};
		cluster_enter(cluster);
		callbackFunc.call(ctx, cluster);
		cluster_exit(cluster);
		return cluster;
	}

	function Diagram(name, callbackFunc, attrs) {
		attrs = attrs || {};
		attrs = mergeAttrs(defaultAttrs.digraph, attrs);
		
		var diagram = {
			type: 'diagram',
			name: name,
			
			attrs: function() {
				return attrs;
			},
		}
		diagram_enter(diagram);
		callbackFunc.call(ctx, diagram);
		diagram_exit(diagram);
		return diagram;
	}


	///////////////////////////////////////////////////
	
	
	function generate(expr) {
		reset();
		eval(expr);
		var viz = generateScript();
		return viz;
	}
	
	function generateScript() {
		var root = rootNode;
		
		var lines = [];
		lines.push(`digraph "${rootNode.name}" {`);
		lines.push(`	graph ${toAttrs(rootNode.attrs())}`);
		lines.push(`	node ${toAttrs(defaultAttrs.node)}`);
		lines.push(`	edge ${toAttrs(defaultAttrs.edge)}`);
		lines.push(``);
		
		generateScriptNode(lines, root, 1);
		
		lines.push(``);
		
		generateScriptEdge(lines, edges);
		
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
					attrs.bgcolor = defaultAttrs.subgraphBgcolors[depth - 1];
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
		if (options.Verbose && options.Verbose == true) {
			console.log(vizScript);
		}

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
