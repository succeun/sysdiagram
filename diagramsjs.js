// https://diagrams.mingrammer.com/docs/getting-started/examples#rabbitmq-consumers-with-custom-nodes

var diagramsjs = (function() {
	
	function uuid() {
	  return 'yxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
	
	function toAttrs(obj) {
		return '[' + Object.keys(obj).map(function(k){
			// if HTML Tag contain, ex: label=< <b>..</b> >
			if (k == "label" && obj[k]) {
				if (obj[k].match(/^< +.+ +>$/g)) {
					return `label=${obj[k]}`;
				}
			}
			return `${k}="${obj[k]}"`; 
		}).join(", ") + ']';
	}
	
	function tabs(count) {
		var tabs = [];
		for (var i = 0; i < count; i++) {
			tabs.push('\t');
		}
		return tabs.join('');
	}
	
	function cloneObject(obj, target) {
		target = target || {};
		for (var key in obj) {
			if (typeof obj[key] == "object" && obj[key] != null) {
				var child = target[key] || {};
				target[key] = cloneObject(obj[key], child);
			} else {
				target[key] = obj[key];
			}
		}
		return target;
	}
	
	function mergeAttrs(src, target) {
		var attrs = {};
		cloneObject(src, attrs);
		cloneObject(target, attrs);
		return attrs;
	}
	
	function getFromUrl(yourUrl){
		var httpreq = new XMLHttpRequest(); // a new request
		httpreq.open("GET",yourUrl,false);
		httpreq.send(null);
		return httpreq.responseText;          
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	
	var defaultAttrs = {
		digraph: {
			fontcolor: "#2D3436",
			fontname: "Sans-Serif",
			fontsize: "15",
			nodesep: "0.60",
			pad: "2.0",
			ranksep: "0.75",
			splines: "ortho",			// none(""), line(false), polyline, curved, ortho, spline(true)
			//labelloc: "b",			// t(top), b(bottom, default), c(center)
			
			rankdir: "LR",
		},
		node: {
			shape: "box",
			style: "rounded",
			fixedsize: true,
			width: "1.4",
			height: "1.9",
			labelloc: "b",				// t(top), b(bottom), c(center, default)
			
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
			labeljust: "l",				// l(left), r(right), c(center)
			pencolor: "#AEB6BE",
			fontname: "Sans-Serif",
			fontsize: "12",
			//labelloc: "t",			// t(top, default), b(bottom), c(center)
			
			bgcolor: null,
			rankdir: "LR",
		},
		subgraphBgcolors: [
			"#E5F5FD", "#EBF3E7", "#ECE8F6", "#FDF7E3"
		],
		graphviz: {
			width: "100%", 
			height: "100%", 
			fit: true, 
			engine: "dot"				// circo, dot (default), fdp, neato, osage, patchwork, twopi
		},
		iconSize: {
			width: "256px",
			height: "256px"
		},
	};

	var rootNode = null;
	var nodeQueue = [];
	var currentNode = null;
	var allNodes = {};	// To determine if it has been created at least once per uuid
	var edges = {};
	
	var icons = {};	// image urls of Node
	
	// Storing variables in scripts
	var context = { 
		eval: function(expr) { return eval(expr); },
		attributes: null,
	};

	var ctx = new Proxy(context, {
	  get: function(target, prop) {
		return Reflect.get(target, prop);
	  },
	  set: function(target, prop, value) {
		if (prop) {
			if (Array.isArray(value)) {
				value = ArrayNode(value);
			}
		}
		return Reflect.set(target, prop, value);
	  }
	});
	
	function reset() {
		rootNode = null;
		nodeQueue = [];
		currentNode = null;
		allNodes = {};
		edges = {};
		
		// remove variables in context
		for (var key in context) {
			if (key == 'eval' || key == 'attributes') continue;
			
			delete context[key];
		}
		context.attributes = cloneObject(defaultAttrs);	// Define attributes to be used within scripts, not global default attributes
	}
	
	function addNode(node) {
		if (allNodes[node.uuid] == null) {
			currentNode[node.uuid] = node;
			allNodes[node.uuid] = node;
		}
	}
	
	var directs = {'none': '-','forward': '->','back': '<-','both': '<->'};
	
	function addEdge(startNode, endNode, direct, attrs) {	//	direct: none, forward, back, both
		attrs = attrs || {};
		attrs.dir = direct;
		if (startNode.name && endNode.name && direct && !attrs.edgetooltip) {
			attrs.edgetooltip = `${startNode.name} ${directs[direct]} ${endNode.name}`; 
		}
		
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
	
	///////////////////////////////////////////////////////////////////////////////////
	
	function connect(me, node, direct) {
		if (Array.isArray(node)) {	// natvie array
			node = ArrayNode(node);
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

	function Node(name, attrs, icon) {
		attrs = attrs || {};
		attrs = mergeAttrs(ctx.attributes.node, attrs);
		
		attrs.label = name;
		if (!attrs.tooltip) {
			attrs.tooltip = name;
		}
		
		if (icon) {
			icons[icon] = true;
			attrs.image = icon;
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
	
	function ArrayNode(nodes) {
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
		attrs = mergeAttrs(ctx.attributes.edge, attrs);
		
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
		attrs = mergeAttrs(ctx.attributes.subgraph, attrs);
		attrs.label = name;
		
		if (!attrs.tooltip) {
			attrs.tooltip = name;
		}
		
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
		attrs = mergeAttrs(ctx.attributes.digraph, attrs);
		
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
	
	var Custom = function(name, icon, attrs){
		return Node(name, attrs, icon);
	};

	///////////////////////////////////////////////////////////////////////////
	var isLoadedResources = false;
	
	function generate(script) {
		if (!isLoadedResources) {
			if (diagramsjs_resources) {
				loadResources(diagramsjs_resources, diagramsjs_resources.baseUrl);
			}
		}
		
		if (!script || script.trim().length == 0) {
			throw new Error("Script for rendering is null or empty.");
		}
		
		reset();
		ctx.eval(script);
		var dot = generateDot();
		return dot;
	}
	
	function generateDot() {
		var lines = [];
		lines.push(`digraph "${rootNode.name}" {`);
		lines.push(`	graph ${toAttrs(rootNode.attrs())}`);
		lines.push(`	node ${toAttrs(ctx.attributes.node)}`);
		lines.push(`	edge ${toAttrs(ctx.attributes.edge)}`);
		lines.push(``);
		
		generateDotNode(lines, rootNode, 1);
		
		lines.push(``);
		
		generateDotEdge(lines, edges);
		
		lines.push(`}`);
		return lines.join('\n');
	}
	
	function generateDotNode(lines, parent, depth) {
		var tab = tabs(depth);
		for (var key in parent){
			var node = parent[key];
			if (node && node.type) {
				if (node.type == 'cluster') {
					lines.push(`${tab}subgraph "cluster_${node.name}" {`);
					var attrs = node.attrs();
					if (!attrs.bgcolor) {
						attrs.bgcolor = ctx.attributes.subgraphBgcolors[depth - 1];
					}
					lines.push(`${tabs(depth + 1)}graph ${toAttrs(attrs)}`);
					generateDotNode(lines, node, depth + 1);
					lines.push(`${tab}}`);
				} else {
					lines.push(`${tab}"${key}" ${toAttrs(node.attrs())}`);
				}
			}
		}
	}
	
	function generateDotEdge(lines, edges) {
		for (var key in edges){
			var edge = edges[key];
			lines.push(`	"${edge.startnode.uuid}" -> "${edge.endnode.uuid}" ${toAttrs(edge.attrs())}`);
		}
	}
	
	function defineNamespaceResources(dir, namespace) {
		for (var key in namespace) {
			if (!namespace[key] || typeof namespace[key] == "function") {
				continue;
			}
			defineResource(dir, namespace, key);
			
			if (!namespace.import) {
				namespace.import = function() {
					var resources = [];
					for (var i = 0; i < arguments.length; i++) {
						var typeName = arguments[i];
						var res = namespace[typeName];
						if (!res) {
							throw new Error('Not found resource. ['+typeName+']');
						}
						resources.push(res);
					}
					return resources;
				}
			}
		}
	}
	
	function defineResource(dir, namespace, key) {
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
	
	function render(selectorOrObj, script, options, cbFunc) {
		var dot = generate(script);
		var graphviz = createGraphviz(selectorOrObj, options);
		return renderDot(graphviz, dot, cbFunc);
	}
	
	function createGraphviz(selectorOrObj, options) {
		options = options || {};
		options = mergeAttrs(ctx.attributes.graphviz, options);
		
		var element = ("string" == typeof selectorOrObj) ? document.querySelector(selectorOrObj) : selectorOrObj;
		
		var graphviz = d3.select(selectorOrObj).graphviz(options);
		
		element.graphviz = graphviz;
		// hack
		graphviz.getSVG = function() {
			var root = this._selection;
			var svg = root.selectWithoutDataPropagation("svg");
			return svg;
		}

		Object.entries(icons).forEach(([key, value]) => {
			graphviz.addImage(key, ctx.attributes.iconSize.width, ctx.attributes.iconSize.height);
		});
		return graphviz;
	}
	
	function renderDot(graphviz, dot, cbFunc) {
		cbFunc = cbFunc || function(){};

		graphviz.renderDot(dot, function() {
			
			cbFunc();
		});
		
		return {
			dot: dot,
			graphviz: graphviz
		}
	}
	
	///////////////////////////////////////////////////////////////////////////

	var diagrams = {};	// Preset namespace resources to be used in scripts
	
	function loadResources(resourceJson, baseUrl) {
		if (resourceJson) {
			diagrams = {};
			
			var baseUrl = baseUrl || "https://github.com/mingrammer/diagrams/raw/master/resources";
			baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
			for (var x in resourceJson) {
				if (x == 'baseUrl') continue;
				
				diagrams[x] = resourceJson[x];
				for (var y in resourceJson[x]) {
					var dir = `${baseUrl}/${x}/${y}/`;
					defineNamespaceResources(dir, resourceJson[x][y]);
				}
			}
			isLoadedResources = true;
		}
	}
	
	///////////////////////////////////////////////////////////////////////////
	
	return {
		loadResources: loadResources,
		attributes: defaultAttrs,
		generate: generate,
		render: render
	};
})();
