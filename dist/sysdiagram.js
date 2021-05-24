//! sysdiagram.js
//! version : 0.1.8
//! authors : Jeong-Ho, Eun
//! license : MIT
//! https://succeun.github.io/sysdiagram

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.sysdiagram = factory()
}(this, (function () { 'use strict';
	
	////////////////////////////////////////////////////////////////////////////////////
	// Default Attributes
	
	var defaultAttrs = {
		digraph: {						// https://graphviz.org/doc/info/attrs.html
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
		node: {							// https://graphviz.org/doc/info/attrs.html
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
		edge: {							// https://graphviz.org/doc/info/attrs.html
			fontname: "Sans-Serif",
			fontsize: "13",
			fontcolor: "#2D3436",
			color: "#7B8894",
		},
		subgraph: {						// https://graphviz.org/doc/info/attrs.html
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
			"#E5F5FD", "#EBF3E7", "#ECE8F6", "#FDF7E3", "#FDEAE3", "#E1FCFA", "#FCE1F9"
		],
		graphviz: {						// https://github.com/magjac/d3-graphviz#supported-options
			width: "100%", 
			height: "100%", 
			fit: true, 
			engine: "dot",				// circo, dot (default), fdp, neato, osage, patchwork, twopi
			zoom: true,				// drag & zoom enable/disable
		},
		iconSize: {
			width: "256px",
			height: "256px",
		},
		toImage: {
			delay: 200,
			format: "png",
			quality: 1,
			scale: 1,
		},
		selector: ".sysdiagram",
		startOnLoad: true,
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	// Resources
	
	var diagramResources = getDiagramResources();
	
	////////////////////////////////////////////////////////////////////////////////////
	// Context

	var rootNode = null;
	var nodeQueue = [];
	var currentNode = null;
	var allNodes = {};	// To determine if it has been created at least once per uuid
	var allEdges = {};
	var allClusters = {};
	
	var icons = {};	// image urls of Node
	
	// Storing variables in scripts
	var context = { 
		eval: function(expr) {
				return eval(expr); 
		},
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
		allEdges = {};
		
		// remove variables in context
		for (var key in context) {
			if (key == 'eval') continue;
			
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
		
		var key = startNode.uuid + '->' + endNode.uuid;
		if (allEdges[key] == null) {
			allEdges[key] = {
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
		allClusters['cluster_' + cluster.uuid] = cluster;
	}
	
	function cluster_exit(cluster) {
		nodeQueue.pop();
		currentNode = nodeQueue[nodeQueue.length - 1];
	}
	
	///////////////////////////////////////////////////////////////////////////////////
	// Diagram, Cluster, Node, Edge, ArrayNode
	
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
			if (node.type == 'edge') {	// ignored direct
				var edge = node;
				me.edgeattrs = edge.attrs();
				edge.srcNode = me;
			} else if (node.type == 'array_node') {
				var nodes = node.nodes;
				for (var i = 0; i < nodes.length; i++) {
					addNode(nodes[i]);
					addEdge(me, nodes[i], direct, me.edgeattrs);
				}
				me.edgeattrs = null;
			} else {
				addNode(node);
				addEdge(me, node, direct, me.edgeattrs);
				me.edgeattrs = null;
			}
		}
		return node;
	}
	
	function connectGroup(nodes, node, direct) {
		if (Array.isArray(node)) {	// natvie array
			node = ArrayNode(node);
		}
		
		if (node.type == 'edge') {	// ignored direct
			for (var i = 0; i < nodes.length; i++) {
				var edge = node;
				nodes[i].edgeattrs = edge.attrs();
			}
			node.srcNode = nodes;
		} else if (node.type == 'array_node') {
			for (var i = 0; i < nodes.length; i++) {
				var tgts = node.nodes;
				for (var j = 0; j < tgts.length; j++) {
					addNode(tgts[j]);
					addEdge(nodes[i], tgts[j], direct, nodes[i].edgeattrs);
					nodes[i].edgeattrs = null;
				}
			}
		} else {
			addNode(node);
			for (var i = 0; i < nodes.length; i++) {
				addEdge(nodes[i], node, direct, nodes[i].edgeattrs);
				nodes[i].edgeattrs = null;
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
			type: 'node',
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
			edge: function() {
				return connect(this, Edge.apply(null, arguments), '');
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
		node.e = node.edge;			// alias (edge)
		
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
			type: 'array_node',
			nodes: nodes,
			uuid: uuid(),
			name: '_array_node_',
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
			edge: function() {
				return connect(this, Edge.apply(null, arguments), '');
			},
			push: function(val) {
				this.nodes.push(val);
			},
		};
		group._ = group.link;		// alias (-)
		group.$_ = group.outin;		// alias (<<) <-
		group._$ = group.inout;		// alias (>>) ->
		group.$_$ = group.both;	// alias (<< >>) <->
		group.left = group.outin;	// alias (<<)
		group.right = group.inout;	// alias (>>)
		group.e = group.edge;			// alias (edge)
		
		return group;
	}
	
	
	function Edge(label, attrs) {
		attrs = isObject(label) ? label : attrs;	// If the first argument is a attributes other than a label
		attrs = attrs || {};
		attrs = mergeAttrs(ctx.attributes.edge, attrs);
		
		if (typeof label == "string") {
			attrs.label = label;
			if (!attrs.tooltip) {
				attrs.tooltip = label;
			}
		}
		
		var edge = {
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
		edge._ = edge.link;			// alias (-)
		edge.$_ = edge.outin;		// alias (<<) <-
		edge._$ = edge.inout;		// alias (>>) ->
		edge.$_$ = edge.both;		// alias (<< >>) <->
		edge.left = edge.outin;		// alias (<<)
		edge.right = edge.inout;	// alias (>>)
		return edge;
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
		attrs.label = name;
		
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
		return Node(name || "Custom", attrs, icon);
	};

	///////////////////////////////////////////////////////////////////////////////////
	// Public function
	
	var isLoadedResources = false;
	
	function generate(script) {
		loadResources();
		
		if (!script || script.trim().length == 0) {
			throw new Error("Script for rendering is null or empty.");
		}
		
		reset();
		try {
			ctx.eval(script);
		} catch(e) {
			if (ctx.onErrorOccurred) {
				ctx.onErrorOccurred(e);
			} else {
				throw e;
			}
		}
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
		
		generateDotEdge(lines, allEdges);
		
		lines.push(`}`);
		return lines.join('\n');
	}
	
	function generateDotNode(lines, parent, depth) {
		var tab = tabs(depth);
		for (var key in parent){
			var node = parent[key];
			if (node && node.type) {
				if (node.type == 'cluster') {
					lines.push(`${tab}subgraph "cluster_${node.uuid}" {`);
					var attrs = node.attrs();
					if (!attrs.bgcolor) {
						attrs.bgcolor = ctx.attributes.subgraphBgcolors[depth - 1];
					}
					lines.push(`${tabs(depth + 1)}graph ${toAttrs(attrs)}`);
					generateDotNode(lines, node, depth + 1);
					lines.push(`${tab}}`);
				} else if (node.type == 'node') {	// ignored array_node
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
		}
	}
	
	function defineResource(dir, namespace, key) {
		var image = namespace[key];
		if (image.startsWith('http:') || image.startsWith('https:') || image.startsWith('file:')) {
			image = image;
		} else {
			image = dir ? dir + image : image;
		}
		namespace[key] = function() {
			var args = [];
			args[0] = arguments[0] || key;
			args[1] = arguments[1];
			args[2] = image;
			var node = Node.apply(null, args);
			return node;
		};
		namespace[key].imageURL = image;
	}
	
	function render(selectorOrElement, script, graphvizOptions, cbFunc) {
		var dot = generate(script);
		var graphviz = createGraphviz(selectorOrElement, graphvizOptions);
		return renderDot(selectorOrElement, graphviz, dot, cbFunc);
	}
	
	function createGraphviz(selectorOrElement, graphvizOptions) {
		graphvizOptions = graphvizOptions || {};
		graphvizOptions = mergeAttrs(ctx.attributes.graphviz, graphvizOptions);
		
		if (graphvizOptions.scale) {
			if (!graphvizOptions.width || !graphvizOptions.height || String(graphvizOptions.width).indexOf("%") != -1  || String(graphvizOptions.height).indexOf("%") != -1) {
				console.warn("To use scale in graphviz, width and height must be set but not %. [ex: {... scale: 0.5, width: 700, height: 400 ...} ]");
			}
		}
		
		var element = ("string" == typeof selectorOrElement) ? document.querySelector(selectorOrElement) : selectorOrElement;
		
		var graphviz = d3.select(selectorOrElement).graphviz(graphvizOptions);
		
		element.graphviz = graphviz;
		
		// Assigned sysdiagram reference
		graphviz.sysdiagram_ctx = cloneObject(ctx);
		graphviz.sysdiagram_allNodes = cloneObject(allNodes);
		graphviz.sysdiagram_allEdges = cloneObject(allEdges);
		graphviz.sysdiagram_allClusters = cloneObject(allClusters);
		
		graphviz.attributer(function(d) {
			if (d.tag == "g" && d.key) {
				if (graphviz.sysdiagram_allNodes[d.key]) {
					d.sysdiagram_data = graphviz.sysdiagram_allNodes[d.key];
				} else if (graphviz.sysdiagram_allEdges[d.key]) {
					d.sysdiagram_data = graphviz.sysdiagram_allEdges[d.key];
				} else if (graphviz.sysdiagram_allClusters[d.key]) {
					d.sysdiagram_data = graphviz.sysdiagram_allClusters[d.key];
				}
			}
		});
		
		// hack
		graphviz.toImage = function(name, options) {
			var svg = this.getSVG();
			return svg ? toImage(svg, name, options) : null;
		};
		
		graphviz.getSVG = function() {
			return element.querySelector('svg');
		};

		Object.entries(icons).forEach(([key, value]) => {
			graphviz.addImage(key, ctx.attributes.iconSize.width, ctx.attributes.iconSize.height);
		});
		
		return graphviz;
	}
	
	function renderDot(selectorOrElement, graphviz, dot, callbackFunc) {
		callbackFunc = callbackFunc || function(){};
		
		var element = ("string" == typeof selectorOrElement) ? document.querySelector(selectorOrElement) : selectorOrElement;

		graphviz.renderDot(dot, function() {
			element.setAttribute("data-sysdiagram-processed", "true");
			
			if (graphviz.sysdiagram_ctx.onCompleted) {
				graphviz.sysdiagram_ctx.onCompleted(element, this);
			}
			callbackFunc(element, graphviz);
		});
		
		return {
			dot: dot,
			graphviz: graphviz
		}
	}
	
	///////////////////////////////////////////////////////////////////////////
	// DOMContentLoaded
	var isLoaded = false;
	
	function initialize(attributes, callbackFunc) {
		attributes = attributes || {};
		var selector = attributes.selector || defaultAttrs.selector;
		var startOnLoad = (attributes.startOnLoad != null) ? attributes.startOnLoad : defaultAttrs.startOnLoad;
		if (startOnLoad) {
			if (!isLoaded) {
				window.addEventListener('DOMContentLoaded', function(event) {
					init(attributes, selector);
				});
			} else {
				console.warn("Sysdiagram is already running on load.");
			}
			isLoaded = true;
		} else {
			init(attributes, selector, callbackFunc);
		}
	}
	
	function init(attributes, selector, callbackFunc) {
		// Change default attributes
		defaultAttrs = mergeAttrs(defaultAttrs, attributes);
		
		var diagrams = document.querySelectorAll(selector);
		for (var i = 0 ; i < diagrams.length; i++) {
			var diagram = diagrams[i];
			var code = diagram.textContent;
			diagram.innerHTML = "";
			render(diagram, code, {}, function(element, graphviz) {
				if (callbackFunc) {
					callbackFunc(element, graphviz);
				}
			});
		}
	}
		
		
	
	///////////////////////////////////////////////////////////////////////////
	// Load Resources
	
	var diagrams = {};	// Preset namespace resources to be used in scripts
	
	function loadResources(resourceJson, baseUrl) {
		if (!isLoadedResources) {
			resourceJson = resourceJson || diagramResources;
			baseUrl = baseUrl || diagramResources.baseUrl;
			
			var baseUrl = baseUrl || "https://github.com/mingrammer/diagrams/raw/master/resources";
			baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
			for (var x in resourceJson) {
				if (x == 'baseUrl') continue;
				
				diagrams[x] = resourceJson[x];
				for (var y in resourceJson[x]) {
					var dir = "";
					if (y.startsWith('http:') || y.startsWith('https:') || y.startsWith('file:')) {
						dir = y;
					} else {
						dir = `${baseUrl}/${x}/${y}/`;
					}
					defineNamespaceResources(dir, resourceJson[x][y]);
				}
			}
			isLoadedResources = true;
		}
		return diagrams;
	}
	
	///////////////////////////////////////////////////////////////////////////
	// To Image from Canvas, SVG
	
	async function copyToCanvas(selectorOrElement, format, quality, scale, delay) {
		var svg = (typeof selectorOrElement == "string") ? document.querySelector(selectorOrElement) : selectorOrElement;
		var svgData = new XMLSerializer().serializeToString(svg);
		
		var svgSize = svg.getBoundingClientRect();
		var canvas = document.createElement('canvas');
		
		//Resize can break shadows
		canvas.width = svgSize.width * scale;
		canvas.height = svgSize.height * scale;
		canvas.style.width = svgSize.width;
		canvas.style.height = svgSize.height;
		
		var canvasCtx = canvas.getContext("2d");
		canvasCtx.scale(scale, scale);
		var v = canvg.Canvg.fromString(canvasCtx, svgData, {
				ignoreMouse: true,
				ignoreAnimation: true,
				createImage: function(src, anonymousCrossOrigin) {
					return new Promise(function(resolve) {
						var img = new Image();
						img.crossOrigin = "Anonymous";
						img.addEventListener("load", function() {
							resolve(img);
						}, false);
						img.src = src;
					});
				},
			});
		
		await v.start();
		
		return new Promise(function(resolve) {
			setTimeout(function() {
				var file = canvas.toDataURL("image/" + format, quality);
				resolve(file);
			}, delay);
		});
	}
	
	function downloadImage(file, filename, format) {
		var a = document.createElement('a');
		a.download = filename + "." + format;
		a.href = file;
		document.body.appendChild(a);
		a.click();
	}

	async function toImage(target, name, options) {
		if (!canvg) {
			throw new Error('Require canvg.js.\nNeed to add <script type="text/javascript" src="https://unpkg.com/canvg@3.0.7/lib/umd.js"></script>');
		}
		options = options || {}
		options.format = options.format || defaultAttrs.toImage.format;
		options.scale = options.scale || defaultAttrs.toImage.scale;
		options.quality = options.quality || defaultAttrs.toImage.quality;
		options.download = (options.download == null) ? true : options.download;
		options.delay = options.delay || defaultAttrs.toImage.delay;
		
		return await copyToCanvas(target,options.format, options.quality, options.scale, options.delay).then(function(file) {
				if (options.download) { 
					downloadImage(file, name, options.format);
				}
				return file;
			})
			.catch(console.error);
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	// Util function
	
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
	
	function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return (
            input != null &&
            Object.prototype.toString.call(input) === '[object Object]'
        );
    }
	
	///////////////////////////////////////////////////////////////////////////
	// Return
	
	return {
		initialize: initialize,
		init: init,
		loadResources: loadResources,
		attributes: defaultAttrs,
		generate: generate,
		render: render,
		toImage: toImage
	};
	
	///////////////////////////////////////////////////////////////////////////
	// Load Resources
	
	function getDiagramResources() {
		var resources = {
			baseUrl: "https://cdn.jsdelivr.net/gh/mingrammer/diagrams/resources/",
			
			alibabacloud: {
				analytics: {
					AnalyticDb: "analytic-db.png",
					ClickHouse: "click-house.png",
					DataLakeAnalytics: "data-lake-analytics.png",
					ElaticMapReduce: "elatic-map-reduce.png",
					OpenSearch: "open-search.png",
				},
				application: {
					ApiGateway: "api-gateway.png",
					BeeBot: "bee-bot.png",
					BlockchainAsAService: "blockchain-as-a-service.png",
					CloudCallCenter: "cloud-call-center.png",
					CodePipeline: "code-pipeline.png",
					DirectMail: "direct-mail.png",
					LogService: "log-service.png",
					MessageNotificationService: "message-notification-service.png",
					NodeJsPerformancePlatform: "node-js-performance-platform.png",
					OpenSearch: "open-search.png",
					PerformanceTestingService: "performance-testing-service.png",
					RdCloud: "rd-cloud.png",
					SmartConversationAnalysis: "smart-conversation-analysis.png",
					Yida: "yida.png",
				},
				communication: {
					DirectMail: "direct-mail.png",
					MobilePush: "mobile-push.png",
				},
				compute: {
					AutoScaling: "auto-scaling.png",
					BatchCompute: "batch-compute.png",
					ContainerRegistry: "container-registry.png",
					ContainerService: "container-service.png",
					ElasticComputeService: "elastic-compute-service.png",
					ElasticContainerInstance: "elastic-container-instance.png",
					ElasticHighPerformanceComputing: "elastic-high-performance-computing.png",
					ElasticSearch: "elastic-search.png",
					FunctionCompute: "function-compute.png",
					OperationOrchestrationService: "operation-orchestration-service.png",
					ResourceOrchestrationService: "resource-orchestration-service.png",
					ServerLoadBalancer: "server-load-balancer.png",
					ServerlessAppEngine: "serverless-app-engine.png",
					SimpleApplicationServer: "simple-application-server.png",
					WebAppService: "web-app-service.png",
				},
				database: {
					ApsaradbCassandra: "apsaradb-cassandra.png",
					ApsaradbHbase: "apsaradb-hbase.png",
					ApsaradbMemcache: "apsaradb-memcache.png",
					ApsaradbMongodb: "apsaradb-mongodb.png",
					ApsaradbOceanbase: "apsaradb-oceanbase.png",
					ApsaradbPolardb: "apsaradb-polardb.png",
					ApsaradbPostgresql: "apsaradb-postgresql.png",
					ApsaradbPpas: "apsaradb-ppas.png",
					ApsaradbRedis: "apsaradb-redis.png",
					ApsaradbSqlserver: "apsaradb-sqlserver.png",
					DataManagementService: "data-management-service.png",
					DataTransmissionService: "data-transmission-service.png",
					DatabaseBackupService: "database-backup-service.png",
					DisributeRelationalDatabaseService: "disribute-relational-database-service.png",
					GraphDatabaseService: "graph-database-service.png",
					HybriddbForMysql: "hybriddb-for-mysql.png",
					RelationalDatabaseService: "relational-database-service.png",
				},
				iot: {
					IotInternetDeviceId: "iot-internet-device-id.png",
					IotLinkWan: "iot-link-wan.png",
					IotMobileConnectionPackage: "iot-mobile-connection-package.png",
					IotPlatform: "iot-platform.png",
				},
				network: {
					Cdn: "cdn.png",
					CloudEnterpriseNetwork: "cloud-enterprise-network.png",
					ElasticIpAddress: "elastic-ip-address.png",
					ExpressConnect: "express-connect.png",
					NatGateway: "nat-gateway.png",
					ServerLoadBalancer: "server-load-balancer.png",
					SmartAccessGateway: "smart-access-gateway.png",
					VirtualPrivateCloud: "virtual-private-cloud.png",
					VpnGateway: "vpn-gateway.png",
				},
				security: {
					AntiBotService: "anti-bot-service.png",
					AntiDdosBasic: "anti-ddos-basic.png",
					AntiDdosPro: "anti-ddos-pro.png",
					AntifraudService: "antifraud-service.png",
					BastionHost: "bastion-host.png",
					CloudFirewall: "cloud-firewall.png",
					CloudSecurityScanner: "cloud-security-scanner.png",
					ContentModeration: "content-moderation.png",
					CrowdsourcedSecurityTesting: "crowdsourced-security-testing.png",
					DataEncryptionService: "data-encryption-service.png",
					DbAudit: "db-audit.png",
					GameShield: "game-shield.png",
					IdVerification: "id-verification.png",
					ManagedSecurityService: "managed-security-service.png",
					SecurityCenter: "security-center.png",
					ServerGuard: "server-guard.png",
					SslCertificates: "ssl-certificates.png",
					WebApplicationFirewall: "web-application-firewall.png",
				},
				storage: {
					CloudStorageGateway: "cloud-storage-gateway.png",
					FileStorageHdfs: "file-storage-hdfs.png",
					FileStorageNas: "file-storage-nas.png",
					HybridBackupRecovery: "hybrid-backup-recovery.png",
					HybridCloudDisasterRecovery: "hybrid-cloud-disaster-recovery.png",
					Imm: "imm.png",
					ObjectStorageService: "object-storage-service.png",
					ObjectTableStore: "object-table-store.png",
				},
				web: {
					Dns: "dns.png",
					Domain: "domain.png",
				}
			},
			aws: {
				analytics: {
					Analytics: "analytics.png",
					Athena: "athena.png",
					CloudsearchSearchDocuments: "cloudsearch-search-documents.png",
					Cloudsearch: "cloudsearch.png",
					DataLakeResource: "data-lake-resource.png",
					DataPipeline: "data-pipeline.png",
					ElasticsearchService: "elasticsearch-service.png",
					EMRCluster: "emr-cluster.png",
					EMREngineMaprM3: "emr-engine-mapr-m3.png",
					EMREngineMaprM5: "emr-engine-mapr-m5.png",
					EMREngineMaprM7: "emr-engine-mapr-m7.png",
					EMREngine: "emr-engine.png",
					EMRHdfsCluster: "emr-hdfs-cluster.png",
					EMR: "emr.png",
					GlueCrawlers: "glue-crawlers.png",
					GlueDataCatalog: "glue-data-catalog.png",
					Glue: "glue.png",
					KinesisDataAnalytics: "kinesis-data-analytics.png",
					KinesisDataFirehose: "kinesis-data-firehose.png",
					KinesisDataStreams: "kinesis-data-streams.png",
					KinesisVideoStreams: "kinesis-video-streams.png",
					Kinesis: "kinesis.png",
					LakeFormation: "lake-formation.png",
					ManagedStreamingForKafka: "managed-streaming-for-kafka.png",
					Quicksight: "quicksight.png",
					RedshiftDenseComputeNode: "redshift-dense-compute-node.png",
					RedshiftDenseStorageNode: "redshift-dense-storage-node.png",
					Redshift: "redshift.png",
				},
				ar: {
					ArVr: "ar-vr.png",
					Sumerian: "sumerian.png",
				},
				blockchain: {
					BlockchainResource: "blockchain-resource.png",
					Blockchain: "blockchain.png",
					ManagedBlockchain: "managed-blockchain.png",
					QuantumLedgerDatabaseQldb: "quantum-ledger-database-qldb.png",
				},
				business: {
					AlexaForBusiness: "alexa-for-business.png",
					BusinessApplications: "business-applications.png",
					Chime: "chime.png",
					Workmail: "workmail.png",
				},
				compute: {
					ApplicationAutoScaling: "application-auto-scaling.png",
					Batch: "batch.png",
					ComputeOptimizer: "compute-optimizer.png",
					Compute: "compute.png",
					EC2Ami: "ec2-ami.png",
					EC2AutoScaling: "ec2-auto-scaling.png",
					EC2ContainerRegistryImage: "ec2-container-registry-image.png",
					EC2ContainerRegistryRegistry: "ec2-container-registry-registry.png",
					EC2ContainerRegistry: "ec2-container-registry.png",
					EC2ElasticIpAddress: "ec2-elastic-ip-address.png",
					EC2ImageBuilder: "ec2-image-builder.png",
					EC2Instance: "ec2-instance.png",
					EC2Instances: "ec2-instances.png",
					EC2Rescue: "ec2-rescue.png",
					EC2SpotInstance: "ec2-spot-instance.png",
					EC2: "ec2.png",
					ElasticBeanstalkApplication: "elastic-beanstalk-application.png",
					ElasticBeanstalkDeployment: "elastic-beanstalk-deployment.png",
					ElasticBeanstalk: "elastic-beanstalk.png",
					ElasticContainerServiceContainer: "elastic-container-service-container.png",
					ElasticContainerServiceService: "elastic-container-service-service.png",
					ElasticContainerService: "elastic-container-service.png",
					ElasticKubernetesService: "elastic-kubernetes-service.png",
					Fargate: "fargate.png",
					LambdaFunction: "lambda-function.png",
					Lambda: "lambda.png",
					Lightsail: "lightsail.png",
					LocalZones: "local-zones.png",
					Outposts: "outposts.png",
					ServerlessApplicationRepository: "serverless-application-repository.png",
					ThinkboxDeadline: "thinkbox-deadline.png",
					ThinkboxDraft: "thinkbox-draft.png",
					ThinkboxFrost: "thinkbox-frost.png",
					ThinkboxKrakatoa: "thinkbox-krakatoa.png",
					ThinkboxSequoia: "thinkbox-sequoia.png",
					ThinkboxStoke: "thinkbox-stoke.png",
					ThinkboxXmesh: "thinkbox-xmesh.png",
					VmwareCloudOnAWS: "vmware-cloud-on-aws.png",
					Wavelength: "wavelength.png",
				},
				cost: {
					Budgets: "budgets.png",
					CostAndUsageReport: "cost-and-usage-report.png",
					CostExplorer: "cost-explorer.png",
					CostManagement: "cost-management.png",
					ReservedInstanceReporting: "reserved-instance-reporting.png",
					SavingsPlans: "savings-plans.png",
				},
				database: {
					AuroraInstance: "aurora-instance.png",
					Aurora: "aurora.png",
					DatabaseMigrationServiceDatabaseMigrationWorkflow: "database-migration-service-database-migration-workflow.png",
					DatabaseMigrationService: "database-migration-service.png",
					Database: "database.png",
					DocumentdbMongodbCompatibility: "documentdb-mongodb-compatibility.png",
					DynamodbAttribute: "dynamodb-attribute.png",
					DynamodbAttributes: "dynamodb-attributes.png",
					DynamodbDax: "dynamodb-dax.png",
					DynamodbGlobalSecondaryIndex: "dynamodb-global-secondary-index.png",
					DynamodbItem: "dynamodb-item.png",
					DynamodbItems: "dynamodb-items.png",
					DynamodbTable: "dynamodb-table.png",
					Dynamodb: "dynamodb.png",
					ElasticacheCacheNode: "elasticache-cache-node.png",
					ElasticacheForMemcached: "elasticache-for-memcached.png",
					ElasticacheForRedis: "elasticache-for-redis.png",
					Elasticache: "elasticache.png",
					KeyspacesManagedApacheCassandraService: "keyspaces-managed-apache-cassandra-service.png",
					Neptune: "neptune.png",
					QuantumLedgerDatabaseQldb: "quantum-ledger-database-qldb.png",
					RDSInstance: "rds-instance.png",
					RDSMariadbInstance: "rds-mariadb-instance.png",
					RDSMysqlInstance: "rds-mysql-instance.png",
					RDSOnVmware: "rds-on-vmware.png",
					RDSOracleInstance: "rds-oracle-instance.png",
					RDSPostgresqlInstance: "rds-postgresql-instance.png",
					RDSSqlServerInstance: "rds-sql-server-instance.png",
					RDS: "rds.png",
					RedshiftDenseComputeNode: "redshift-dense-compute-node.png",
					RedshiftDenseStorageNode: "redshift-dense-storage-node.png",
					Redshift: "redshift.png",
					Timestream: "timestream.png",
				},
				devtools: {
					CloudDevelopmentKit: "cloud-development-kit.png",
					Cloud9Resource: "cloud9-resource.png",
					Cloud9: "cloud9.png",
					Codebuild: "codebuild.png",
					Codecommit: "codecommit.png",
					Codedeploy: "codedeploy.png",
					Codepipeline: "codepipeline.png",
					Codestar: "codestar.png",
					CommandLineInterface: "command-line-interface.png",
					DeveloperTools: "developer-tools.png",
					ToolsAndSdks: "tools-and-sdks.png",
					XRay: "x-ray.png",
				},
				enablement: {
					CustomerEnablement: "customer-enablement.png",
					Iq: "iq.png",
					ManagedServices: "managed-services.png",
					ProfessionalServices: "professional-services.png",
					Support: "support.png",
				},
				enduser: {
					Appstream20: "appstream-2-0.png",
					DesktopAndAppStreaming: "desktop-and-app-streaming.png",
					Workdocs: "workdocs.png",
					Worklink: "worklink.png",
					Workspaces: "workspaces.png",
				},
				engagement: {
					Connect: "connect.png",
					CustomerEngagement: "customer-engagement.png",
					Pinpoint: "pinpoint.png",
					SimpleEmailServiceSesEmail: "simple-email-service-ses-email.png",
					SimpleEmailServiceSes: "simple-email-service-ses.png",
				},
				game: {
					GameTech: "game-tech.png",
					Gamelift: "gamelift.png",
				},
				general: {
					Client: "client.png",
					Disk: "disk.png",
					Forums: "forums.png",
					General: "general.png",
					GenericDatabase: "generic-database.png",
					GenericFirewall: "generic-firewall.png",
					GenericOfficeBuilding: "generic-office-building.png",
					GenericSamlToken: "generic-saml-token.png",
					GenericSDK: "generic-sdk.png",
					InternetAlt1: "internet-alt1.png",
					InternetAlt2: "internet-alt2.png",
					InternetGateway: "internet-gateway.png",
					Marketplace: "marketplace.png",
					MobileClient: "mobile-client.png",
					Multimedia: "multimedia.png",
					OfficeBuilding: "office-building.png",
					SamlToken: "saml-token.png",
					SDK: "sdk.png",
					SslPadlock: "ssl-padlock.png",
					TapeStorage: "tape-storage.png",
					Toolkit: "toolkit.png",
					TraditionalServer: "traditional-server.png",
					User: "user.png",
					Users: "users.png",
				},
				integration: {
					ApplicationIntegration: "application-integration.png",
					Appsync: "appsync.png",
					ConsoleMobileApplication: "console-mobile-application.png",
					EventResource: "event-resource.png",
					EventbridgeCustomEventBusResource: "eventbridge-custom-event-bus-resource.png",
					EventbridgeDefaultEventBusResource: "eventbridge-default-event-bus-resource.png",
					EventbridgeSaasPartnerEventBusResource: "eventbridge-saas-partner-event-bus-resource.png",
					Eventbridge: "eventbridge.png",
					ExpressWorkflows: "express-workflows.png",
					MQ: "mq.png",
					SimpleNotificationServiceSnsEmailNotification: "simple-notification-service-sns-email-notification.png",
					SimpleNotificationServiceSnsHttpNotification: "simple-notification-service-sns-http-notification.png",
					SimpleNotificationServiceSnsTopic: "simple-notification-service-sns-topic.png",
					SimpleNotificationServiceSns: "simple-notification-service-sns.png",
					SimpleQueueServiceSqsMessage: "simple-queue-service-sqs-message.png",
					SimpleQueueServiceSqsQueue: "simple-queue-service-sqs-queue.png",
					SimpleQueueServiceSqs: "simple-queue-service-sqs.png",
					StepFunctions: "step-functions.png",
				},
				iot: {
					Freertos: "freertos.png",
					InternetOfThings: "internet-of-things.png",
					Iot1Click: "iot-1-click.png",
					IotAction: "iot-action.png",
					IotActuator: "iot-actuator.png",
					IotAlexaEcho: "iot-alexa-echo.png",
					IotAlexaEnabledDevice: "iot-alexa-enabled-device.png",
					IotAlexaSkill: "iot-alexa-skill.png",
					IotAlexaVoiceService: "iot-alexa-voice-service.png",
					IotAnalyticsChannel: "iot-analytics-channel.png",
					IotAnalyticsDataSet: "iot-analytics-data-set.png",
					IotAnalyticsDataStore: "iot-analytics-data-store.png",
					IotAnalyticsNotebook: "iot-analytics-notebook.png",
					IotAnalyticsPipeline: "iot-analytics-pipeline.png",
					IotAnalytics: "iot-analytics.png",
					IotBank: "iot-bank.png",
					IotBicycle: "iot-bicycle.png",
					IotButton: "iot-button.png",
					IotCamera: "iot-camera.png",
					IotCar: "iot-car.png",
					IotCart: "iot-cart.png",
					IotCertificate: "iot-certificate.png",
					IotCoffeePot: "iot-coffee-pot.png",
					IotCore: "iot-core.png",
					IotDesiredState: "iot-desired-state.png",
					IotDeviceDefender: "iot-device-defender.png",
					IotDeviceGateway: "iot-device-gateway.png",
					IotDeviceManagement: "iot-device-management.png",
					IotDoorLock: "iot-door-lock.png",
					IotEvents: "iot-events.png",
					IotFactory: "iot-factory.png",
					IotFireTvStick: "iot-fire-tv-stick.png",
					IotFireTv: "iot-fire-tv.png",
					IotGeneric: "iot-generic.png",
					IotGreengrassConnector: "iot-greengrass-connector.png",
					IotGreengrass: "iot-greengrass.png",
					IotHardwareBoard: "iot-hardware-board.png",
					IotHouse: "iot-house.png",
					IotHttp: "iot-http.png",
					IotHttp2: "iot-http2.png",
					IotJobs: "iot-jobs.png",
					IotLambda: "iot-lambda.png",
					IotLightbulb: "iot-lightbulb.png",
					IotMedicalEmergency: "iot-medical-emergency.png",
					IotMqtt: "iot-mqtt.png",
					IotOverTheAirUpdate: "iot-over-the-air-update.png",
					IotPolicyEmergency: "iot-policy-emergency.png",
					IotPolicy: "iot-policy.png",
					IotReportedState: "iot-reported-state.png",
					IotRule: "iot-rule.png",
					IotSensor: "iot-sensor.png",
					IotServo: "iot-servo.png",
					IotShadow: "iot-shadow.png",
					IotSimulator: "iot-simulator.png",
					IotSitewise: "iot-sitewise.png",
					IotThermostat: "iot-thermostat.png",
					IotThingsGraph: "iot-things-graph.png",
					IotTopic: "iot-topic.png",
					IotTravel: "iot-travel.png",
					IotUtility: "iot-utility.png",
					IotWindfarm: "iot-windfarm.png",
				},
				management: {
					AutoScaling: "auto-scaling.png",
					CloudformationChangeSet: "cloudformation-change-set.png",
					CloudformationStack: "cloudformation-stack.png",
					CloudformationTemplate: "cloudformation-template.png",
					Cloudformation: "cloudformation.png",
					Cloudtrail: "cloudtrail.png",
					CloudwatchAlarm: "cloudwatch-alarm.png",
					CloudwatchEventEventBased: "cloudwatch-event-event-based.png",
					CloudwatchEventTimeBased: "cloudwatch-event-time-based.png",
					CloudwatchRule: "cloudwatch-rule.png",
					Cloudwatch: "cloudwatch.png",
					Codeguru: "codeguru.png",
					CommandLineInterface: "command-line-interface.png",
					Config: "config.png",
					ControlTower: "control-tower.png",
					LicenseManager: "license-manager.png",
					ManagedServices: "managed-services.png",
					ManagementAndGovernance: "management-and-governance.png",
					ManagementConsole: "management-console.png",
					OpsworksApps: "opsworks-apps.png",
					OpsworksDeployments: "opsworks-deployments.png",
					OpsworksInstances: "opsworks-instances.png",
					OpsworksLayers: "opsworks-layers.png",
					OpsworksMonitoring: "opsworks-monitoring.png",
					OpsworksPermissions: "opsworks-permissions.png",
					OpsworksResources: "opsworks-resources.png",
					OpsworksStack: "opsworks-stack.png",
					Opsworks: "opsworks.png",
					OrganizationsAccount: "organizations-account.png",
					OrganizationsOrganizationalUnit: "organizations-organizational-unit.png",
					Organizations: "organizations.png",
					PersonalHealthDashboard: "personal-health-dashboard.png",
					ServiceCatalog: "service-catalog.png",
					SystemsManagerAutomation: "systems-manager-automation.png",
					SystemsManagerDocuments: "systems-manager-documents.png",
					SystemsManagerInventory: "systems-manager-inventory.png",
					SystemsManagerMaintenanceWindows: "systems-manager-maintenance-windows.png",
					SystemsManagerOpscenter: "systems-manager-opscenter.png",
					SystemsManagerParameterStore: "systems-manager-parameter-store.png",
					SystemsManagerPatchManager: "systems-manager-patch-manager.png",
					SystemsManagerRunCommand: "systems-manager-run-command.png",
					SystemsManagerStateManager: "systems-manager-state-manager.png",
					SystemsManager: "systems-manager.png",
					TrustedAdvisorChecklistCost: "trusted-advisor-checklist-cost.png",
					TrustedAdvisorChecklistFaultTolerant: "trusted-advisor-checklist-fault-tolerant.png",
					TrustedAdvisorChecklistPerformance: "trusted-advisor-checklist-performance.png",
					TrustedAdvisorChecklistSecurity: "trusted-advisor-checklist-security.png",
					TrustedAdvisorChecklist: "trusted-advisor-checklist.png",
					TrustedAdvisor: "trusted-advisor.png",
					WellArchitectedTool: "well-architected-tool.png",
				},
				media: {
					ElasticTranscoder: "elastic-transcoder.png",
					ElementalConductor: "elemental-conductor.png",
					ElementalDelta: "elemental-delta.png",
					ElementalLive: "elemental-live.png",
					ElementalMediaconnect: "elemental-mediaconnect.png",
					ElementalMediaconvert: "elemental-mediaconvert.png",
					ElementalMedialive: "elemental-medialive.png",
					ElementalMediapackage: "elemental-mediapackage.png",
					ElementalMediastore: "elemental-mediastore.png",
					ElementalMediatailor: "elemental-mediatailor.png",
					ElementalServer: "elemental-server.png",
					KinesisVideoStreams: "kinesis-video-streams.png",
					MediaServices: "media-services.png",
				},
				migration: {
					ApplicationDiscoveryService: "application-discovery-service.png",
					CloudendureMigration: "cloudendure-migration.png",
					DatabaseMigrationService: "database-migration-service.png",
					DatasyncAgent: "datasync-agent.png",
					Datasync: "datasync.png",
					MigrationAndTransfer: "migration-and-transfer.png",
					MigrationHub: "migration-hub.png",
					ServerMigrationService: "server-migration-service.png",
					SnowballEdge: "snowball-edge.png",
					Snowball: "snowball.png",
					Snowmobile: "snowmobile.png",
					TransferForSftp: "transfer-for-sftp.png",
				},
				ml: {
					ApacheMxnetOnAWS: "apache-mxnet-on-aws.png",
					AugmentedAi: "augmented-ai.png",
					Comprehend: "comprehend.png",
					DeepLearningAmis: "deep-learning-amis.png",
					DeepLearningContainers: "deep-learning-containers.png",
					Deepcomposer: "deepcomposer.png",
					Deeplens: "deeplens.png",
					Deepracer: "deepracer.png",
					ElasticInference: "elastic-inference.png",
					Forecast: "forecast.png",
					FraudDetector: "fraud-detector.png",
					Kendra: "kendra.png",
					Lex: "lex.png",
					MachineLearning: "machine-learning.png",
					Personalize: "personalize.png",
					Polly: "polly.png",
					RekognitionImage: "rekognition-image.png",
					RekognitionVideo: "rekognition-video.png",
					Rekognition: "rekognition.png",
					SagemakerGroundTruth: "sagemaker-ground-truth.png",
					SagemakerModel: "sagemaker-model.png",
					SagemakerNotebook: "sagemaker-notebook.png",
					SagemakerTrainingJob: "sagemaker-training-job.png",
					Sagemaker: "sagemaker.png",
					TensorflowOnAWS: "tensorflow-on-aws.png",
					Textract: "textract.png",
					Transcribe: "transcribe.png",
					Translate: "translate.png",
				},
				mobile: {
					Amplify: "amplify.png",
					APIGatewayEndpoint: "api-gateway-endpoint.png",
					APIGateway: "api-gateway.png",
					Appsync: "appsync.png",
					DeviceFarm: "device-farm.png",
					Mobile: "mobile.png",
					Pinpoint: "pinpoint.png",
				},
				network: {
					APIGatewayEndpoint: "api-gateway-endpoint.png",
					APIGateway: "api-gateway.png",
					AppMesh: "app-mesh.png",
					ClientVpn: "client-vpn.png",
					CloudMap: "cloud-map.png",
					CloudFrontDownloadDistribution: "cloudfront-download-distribution.png",
					CloudFrontEdgeLocation: "cloudfront-edge-location.png",
					CloudFrontStreamingDistribution: "cloudfront-streaming-distribution.png",
					CloudFront: "cloudfront.png",
					DirectConnect: "direct-connect.png",
					ElasticLoadBalancing: "elastic-load-balancing.png",
					ElbApplicationLoadBalancer: "elb-application-load-balancer.png",
					ElbClassicLoadBalancer: "elb-classic-load-balancer.png",
					ElbNetworkLoadBalancer: "elb-network-load-balancer.png",
					Endpoint: "endpoint.png",
					GlobalAccelerator: "global-accelerator.png",
					InternetGateway: "internet-gateway.png",
					Nacl: "nacl.png",
					NATGateway: "nat-gateway.png",
					NetworkingAndContentDelivery: "networking-and-content-delivery.png",
					PrivateSubnet: "private-subnet.png",
					Privatelink: "privatelink.png",
					PublicSubnet: "public-subnet.png",
					Route53HostedZone: "route-53-hosted-zone.png",
					Route53: "route-53.png",
					RouteTable: "route-table.png",
					SiteToSiteVpn: "site-to-site-vpn.png",
					TransitGateway: "transit-gateway.png",
					VPCCustomerGateway: "vpc-customer-gateway.png",
					VPCElasticNetworkAdapter: "vpc-elastic-network-adapter.png",
					VPCElasticNetworkInterface: "vpc-elastic-network-interface.png",
					VPCFlowLogs: "vpc-flow-logs.png",
					VPCPeering: "vpc-peering.png",
					VPCRouter: "vpc-router.png",
					VPCTrafficMirroring: "vpc-traffic-mirroring.png",
					VPC: "vpc.png",
					VpnConnection: "vpn-connection.png",
					VpnGateway: "vpn-gateway.png",
				},
				quantum: {
					Braket: "braket.png",
					QuantumTechnologies: "quantum-technologies.png",
				},
				robotics: {
					RobomakerCloudExtensionRos: "robomaker-cloud-extension-ros.png",
					RobomakerDevelopmentEnvironment: "robomaker-development-environment.png",
					RobomakerFleetManagement: "robomaker-fleet-management.png",
					RobomakerSimulator: "robomaker-simulator.png",
					Robomaker: "robomaker.png",
					Robotics: "robotics.png",
				},
				satellite: {
					GroundStation: "ground-station.png",
					Satellite: "satellite.png",
				},
				security: {
					AdConnector: "ad-connector.png",
					Artifact: "artifact.png",
					CertificateAuthority: "certificate-authority.png",
					CertificateManager: "certificate-manager.png",
					CloudDirectory: "cloud-directory.png",
					Cloudhsm: "cloudhsm.png",
					Cognito: "cognito.png",
					Detective: "detective.png",
					DirectoryService: "directory-service.png",
					FirewallManager: "firewall-manager.png",
					Guardduty: "guardduty.png",
					IdentityAndAccessManagementIamAccessAnalyzer: "identity-and-access-management-iam-access-analyzer.png",
					IdentityAndAccessManagementIamAddOn: "identity-and-access-management-iam-add-on.png",
					IdentityAndAccessManagementIamAWSStsAlternate: "identity-and-access-management-iam-aws-sts-alternate.png",
					IdentityAndAccessManagementIamAWSSts: "identity-and-access-management-iam-aws-sts.png",
					IdentityAndAccessManagementIamDataEncryptionKey: "identity-and-access-management-iam-data-encryption-key.png",
					IdentityAndAccessManagementIamEncryptedData: "identity-and-access-management-iam-encrypted-data.png",
					IdentityAndAccessManagementIamLongTermSecurityCredential: "identity-and-access-management-iam-long-term-security-credential.png",
					IdentityAndAccessManagementIamMfaToken: "identity-and-access-management-iam-mfa-token.png",
					IdentityAndAccessManagementIamPermissions: "identity-and-access-management-iam-permissions.png",
					IdentityAndAccessManagementIamRole: "identity-and-access-management-iam-role.png",
					IdentityAndAccessManagementIamTemporarySecurityCredential: "identity-and-access-management-iam-temporary-security-credential.png",
					IdentityAndAccessManagementIam: "identity-and-access-management-iam.png",
					InspectorAgent: "inspector-agent.png",
					Inspector: "inspector.png",
					KeyManagementService: "key-management-service.png",
					Macie: "macie.png",
					ManagedMicrosoftAd: "managed-microsoft-ad.png",
					ResourceAccessManager: "resource-access-manager.png",
					SecretsManager: "secrets-manager.png",
					SecurityHubFinding: "security-hub-finding.png",
					SecurityHub: "security-hub.png",
					SecurityIdentityAndCompliance: "security-identity-and-compliance.png",
					ShieldAdvanced: "shield-advanced.png",
					Shield: "shield.png",
					SimpleAd: "simple-ad.png",
					SingleSignOn: "single-sign-on.png",
					WAFFilteringRule: "waf-filtering-rule.png",
					WAF: "waf.png",
				},
				storage: {
					Backup: "backup.png",
					CloudendureDisasterRecovery: "cloudendure-disaster-recovery.png",
					EFSInfrequentaccessPrimaryBg: "efs-infrequentaccess-primary-bg.png",
					EFSStandardPrimaryBg: "efs-standard-primary-bg.png",
					ElasticBlockStoreEBSSnapshot: "elastic-block-store-ebs-snapshot.png",
					ElasticBlockStoreEBSVolume: "elastic-block-store-ebs-volume.png",
					ElasticBlockStoreEBS: "elastic-block-store-ebs.png",
					ElasticFileSystemEFSFileSystem: "elastic-file-system-efs-file-system.png",
					ElasticFileSystemEFS: "elastic-file-system-efs.png",
					FsxForLustre: "fsx-for-lustre.png",
					FsxForWindowsFileServer: "fsx-for-windows-file-server.png",
					Fsx: "fsx.png",
					MultipleVolumesResource: "multiple-volumes-resource.png",
					S3GlacierArchive: "s3-glacier-archive.png",
					S3GlacierVault: "s3-glacier-vault.png",
					S3Glacier: "s3-glacier.png",
					SimpleStorageServiceS3BucketWithObjects: "simple-storage-service-s3-bucket-with-objects.png",
					SimpleStorageServiceS3Bucket: "simple-storage-service-s3-bucket.png",
					SimpleStorageServiceS3Object: "simple-storage-service-s3-object.png",
					SimpleStorageServiceS3: "simple-storage-service-s3.png",
					SnowFamilySnowballImportExport: "snow-family-snowball-import-export.png",
					SnowballEdge: "snowball-edge.png",
					Snowball: "snowball.png",
					Snowmobile: "snowmobile.png",
					StorageGatewayCachedVolume: "storage-gateway-cached-volume.png",
					StorageGatewayNonCachedVolume: "storage-gateway-non-cached-volume.png",
					StorageGatewayVirtualTapeLibrary: "storage-gateway-virtual-tape-library.png",
					StorageGateway: "storage-gateway.png",
					Storage: "storage.png",
				},
			},
			azure: {
				analytics: {
					AnalysisServices: "analysis-services.png",
					DataExplorerClusters: "data-explorer-clusters.png",
					DataFactories: "data-factories.png",
					DataLakeAnalytics: "data-lake-analytics.png",
					DataLakeStoreGen1: "data-lake-store-gen1.png",
					Databricks: "databricks.png",
					EventHubClusters: "event-hub-clusters.png",
					EventHubs: "event-hubs.png",
					Hdinsightclusters: "hdinsightclusters.png",
					LogAnalyticsWorkspaces: "log-analytics-workspaces.png",
					StreamAnalyticsJobs: "stream-analytics-jobs.png",
				},
				compute: {
					AvailabilitySets: "availability-sets.png",
					BatchAccounts: "batch-accounts.png",
					CitrixVirtualDesktopsEssentials: "citrix-virtual-desktops-essentials.png",
					CloudServicesClassic: "cloud-services-classic.png",
					CloudServices: "cloud-services.png",
					CloudsimpleVirtualMachines: "cloudsimple-virtual-machines.png",
					ContainerInstances: "container-instances.png",
					ContainerRegistries: "container-registries.png",
					DiskSnapshots: "disk-snapshots.png",
					Disks: "disks.png",
					FunctionApps: "function-apps.png",
					KubernetesServices: "kubernetes-services.png",
					MeshApplications: "mesh-applications.png",
					SAPHANAOnAzure: "sap-hana-on-azure.png",
					ServiceFabricClusters: "service-fabric-clusters.png",
					VMClassic: "vm-classic.png",
					VMImages: "vm-images.png",
					VMLinux: "vm-linux.png",
					VMScaleSet: "vm-scale-set.png",
					VMWindows: "vm-windows.png",
					VM: "vm.png",
				},
				database: {
					BlobStorage: "blob-storage.png",
					CacheForRedis: "cache-for-redis.png",
					CosmosDb: "cosmos-db.png",
					DataLake: "data-lake.png",
					DatabaseForMariadbServers: "database-for-mariadb-servers.png",
					DatabaseForMysqlServers: "database-for-mysql-servers.png",
					DatabaseForPostgresqlServers: "database-for-postgresql-servers.png",
					ElasticDatabasePools: "elastic-database-pools.png",
					ElasticJobAgents: "elastic-job-agents.png",
					ManagedDatabases: "managed-databases.png",
					SQLDatabases: "sql-databases.png",
					SQLDatawarehouse: "sql-datawarehouse.png",
					SQLManagedInstances: "sql-managed-instances.png",
					SQLServerStretchDatabases: "sql-server-stretch-databases.png",
					SQLServers: "sql-servers.png",
					VirtualClusters: "virtual-clusters.png",
					VirtualDatacenter: "virtual-datacenter.png",
				},
				devops: {
					ApplicationInsights: "application-insights.png",
					Artifacts: "artifacts.png",
					Boards: "boards.png",
					Devops: "devops.png",
					DevtestLabs: "devtest-labs.png",
					Pipelines: "pipelines.png",
					Repos: "repos.png",
					TestPlans: "test-plans.png",
				},
				general: {
					Allresources: "allresources.png",
					Azurehome: "azurehome.png",
					Developertools: "developertools.png",
					Helpsupport: "helpsupport.png",
					Information: "information.png",
					Managementgroups: "managementgroups.png",
					Marketplace: "marketplace.png",
					Quickstartcenter: "quickstartcenter.png",
					Recent: "recent.png",
					Reservations: "reservations.png",
					Resource: "resource.png",
					Resourcegroups: "resourcegroups.png",
					Servicehealth: "servicehealth.png",
					Shareddashboard: "shareddashboard.png",
					Subscriptions: "subscriptions.png",
					Support: "support.png",
					Supportrequests: "supportrequests.png",
					Tag: "tag.png",
					Tags: "tags.png",
					Templates: "templates.png",
					Twousericon: "twousericon.png",
					Userhealthicon: "userhealthicon.png",
					Usericon: "usericon.png",
					Userprivacy: "userprivacy.png",
					Userresource: "userresource.png",
					Whatsnew: "whatsnew.png",
				},
				identity: {
					AccessReview: "access-review.png",
					ActiveDirectoryConnectHealth: "active-directory-connect-health.png",
					ActiveDirectory: "active-directory.png",
					ADB2C: "ad-b2c.png",
					ADDomainServices: "ad-domain-services.png",
					ADIdentityProtection: "ad-identity-protection.png",
					ADPrivilegedIdentityManagement: "ad-privileged-identity-management.png",
					AppRegistrations: "app-registrations.png",
					ConditionalAccess: "conditional-access.png",
					EnterpriseApplications: "enterprise-applications.png",
					IdentityGovernance: "identity-governance.png",
					InformationProtection: "information-protection.png",
					ManagedIdentities: "managed-identities.png",
				},
				integration: {
					APIForFhir: "api-for-fhir.png",
					APIManagement: "api-management.png",
					AppConfiguration: "app-configuration.png",
					DataCatalog: "data-catalog.png",
					EventGridDomains: "event-grid-domains.png",
					EventGridSubscriptions: "event-grid-subscriptions.png",
					EventGridTopics: "event-grid-topics.png",
					IntegrationAccounts: "integration-accounts.png",
					IntegrationServiceEnvironments: "integration-service-environments.png",
					LogicAppsCustomConnector: "logic-apps-custom-connector.png",
					LogicApps: "logic-apps.png",
					SendgridAccounts: "sendgrid-accounts.png",
					ServiceBusRelays: "service-bus-relays.png",
					ServiceBus: "service-bus.png",
					ServiceCatalogManagedApplicationDefinitions: "service-catalog-managed-application-definitions.png",
					SoftwareAsAService: "software-as-a-service.png",
					StorsimpleDeviceManagers: "storsimple-device-managers.png",
				},
				iot: {
					DeviceProvisioningServices: "device-provisioning-services.png",
					DigitalTwins: "digital-twins.png",
					IotCentralApplications: "iot-central-applications.png",
					IotHubSecurity: "iot-hub-security.png",
					IotHub: "iot-hub.png",
					Maps: "maps.png",
					Sphere: "sphere.png",
					TimeSeriesInsightsEnvironments: "time-series-insights-environments.png",
					TimeSeriesInsightsEventsSources: "time-series-insights-events-sources.png",
					Windows10IotCoreServices: "windows-10-iot-core-services.png",
				},
				migration: {
					DatabaseMigrationServices: "database-migration-services.png",
					MigrationProjects: "migration-projects.png",
					RecoveryServicesVaults: "recovery-services-vaults.png",
				},
				ml: {
					BatchAI: "batch-ai.png",
					BotServices: "bot-services.png",
					CognitiveServices: "cognitive-services.png",
					GenomicsAccounts: "genomics-accounts.png",
					MachineLearningServiceWorkspaces: "machine-learning-service-workspaces.png",
					MachineLearningStudioWebServicePlans: "machine-learning-studio-web-service-plans.png",
					MachineLearningStudioWebServices: "machine-learning-studio-web-services.png",
					MachineLearningStudioWorkspaces: "machine-learning-studio-workspaces.png",
				},
				mobile: {
					AppServiceMobile: "app-service---mobile.png",
					MobileEngagement: "mobile-engagement.png",
					NotificationHubs: "notification-hubs.png",
				},
				network: {
					ApplicationGateway: "application-gateway.png",
					ApplicationSecurityGroups: "application-security-groups.png",
					CDNProfiles: "cdn-profiles.png",
					Connections: "connections.png",
					DDOSProtectionPlans: "ddos-protection-plans.png",
					DNSPrivateZones: "dns-private-zones.png",
					DNSZones: "dns-zones.png",
					ExpressrouteCircuits: "expressroute-circuits.png",
					Firewall: "firewall.png",
					FrontDoors: "front-doors.png",
					LoadBalancers: "load-balancers.png",
					LocalNetworkGateways: "local-network-gateways.png",
					NetworkInterfaces: "network-interfaces.png",
					NetworkSecurityGroupsClassic: "network-security-groups-classic.png",
					NetworkWatcher: "network-watcher.png",
					OnPremisesDataGateways: "on-premises-data-gateways.png",
					PublicIpAddresses: "public-ip-addresses.png",
					ReservedIpAddressesClassic: "reserved-ip-addresses-classic.png",
					RouteFilters: "route-filters.png",
					RouteTables: "route-tables.png",
					ServiceEndpointPolicies: "service-endpoint-policies.png",
					Subnets: "subnets.png",
					TrafficManagerProfiles: "traffic-manager-profiles.png",
					VirtualNetworkClassic: "virtual-network-classic.png",
					VirtualNetworkGateways: "virtual-network-gateways.png",
					VirtualNetworks: "virtual-networks.png",
					VirtualWans: "virtual-wans.png",
				},
				security: {
					KeyVaults: "key-vaults.png",
					SecurityCenter: "security-center.png",
					Sentinel: "sentinel.png",
				},
				storage: {
					ArchiveStorage: "archive-storage.png",
					Azurefxtedgefiler: "azurefxtedgefiler.png",
					BlobStorage: "blob-storage.png",
					DataBoxEdgeDataBoxGateway: "data-box-edge---data-box-gateway.png",
					DataBox: "data-box.png",
					DataLakeStorage: "data-lake-storage.png",
					GeneralStorage: "general-storage.png",
					NetappFiles: "netapp-files.png",
					QueuesStorage: "queues-storage.png",
					StorageAccountsClassic: "storage-accounts-classic.png",
					StorageAccounts: "storage-accounts.png",
					StorageExplorer: "storage-explorer.png",
					StorageSyncServices: "storage-sync-services.png",
					StorsimpleDataManagers: "storsimple-data-managers.png",
					StorsimpleDeviceManagers: "storsimple-device-managers.png",
					TableStorage: "table-storage.png",
				},
				web: {
					APIConnections: "api-connections.png",
					AppServiceCertificates: "app-service-certificates.png",
					AppServiceDomains: "app-service-domains.png",
					AppServiceEnvironments: "app-service-environments.png",
					AppServicePlans: "app-service-plans.png",
					AppServices: "app-services.png",
					MediaServices: "media-services.png",
					NotificationHubNamespaces: "notification-hub-namespaces.png",
					Search: "search.png",
					Signalr: "signalr.png",
				}
			},
			elastic: {
				elasticsearch: {
					Alerting: "alerting.png",
					Beats: "beats.png",
					Elasticsearch: "elasticsearch.png",
					Kibana: "kibana.png",
					Logstash: "logstash.png",
					MachineLearning: "machine-learning.png",
					Maps: "maps.png",
					Monitoring: "monitoring.png",
					SecuritySettings: "security-settings.png",
					Sql: "sql.png",
				},
				enterprisesearch: {
					AppSearch: "app-search.png",
					EnterpriseSearch: "enterprise-search.png",
					SiteSearch: "site-search.png",
					WorkplaceSearch: "workplace-search.png",
				},
				observability: {
					APM: "apm.png",
					Logs: "logs.png",
					Metrics: "metrics.png",
					Observability: "observability.png",
					Uptime: "uptime.png",
				},
				orchestration: {
					ECE: "ece.png",
					ECK: "eck.png",
				},
				saas: {
					Cloud: "cloud.png",
					Elastic: "elastic.png",
				},
				security: {
					Endpoint: "endpoint.png",
					Security: "security.png",
					SIEM: "siem.png",
				}
			},
			firebase: {
				base: {
					Firebase: "firebase.png",
				},
				develop: {
					Authentication: "authentication.png",
					Firestore: "firestore.png",
					Functions: "functions.png",
					Hosting: "hosting.png",
					MLKit: "ml-kit.png",
					RealtimeDatabase: "realtime-database.png",
					Storage: "storage.png",
				},
				extentions: {
					Extensions: "extensions.png",
				},
				grow: {
					ABTesting: "ab-testing.png",
					AppIndexing: "app-indexing.png",
					DynamicLinks: "dynamic-links.png",
					InAppMessaging: "in-app-messaging.png",
					Invites: "invites.png",
					Messaging: "messaging.png",
					Predictions: "predictions.png",
					RemoteConfig: "remote-config.png",
				},
				quality: {
					AppDistribution: "app-distribution.png",
					CrashReporting: "crash-reporting.png",
					Crashlytics: "crashlytics.png",
					PerformanceMonitoring: "performance-monitoring.png",
					TestLab: "test-lab.png",
				}
			},
			gcp: {
				analytics: {
					Bigquery: "bigquery.png",
					Composer: "composer.png",
					DataCatalog: "data-catalog.png",
					DataFusion: "data-fusion.png",
					Dataflow: "dataflow.png",
					Datalab: "datalab.png",
					Dataprep: "dataprep.png",
					Dataproc: "dataproc.png",
					Genomics: "genomics.png",
					Pubsub: "pubsub.png",
				},
				api: {
					Endpoints: "endpoints.png",
				},
				compute: {
					AppEngine: "app-engine.png",
					ComputeEngine: "compute-engine.png",
					ContainerOptimizedOS: "container-optimized-os.png",
					Functions: "functions.png",
					GKEOnPrem: "gke-on-prem.png",
					GPU: "gpu.png",
					KubernetesEngine: "kubernetes-engine.png",
					Run: "run.png",
				},
				database: {
					Bigtable: "bigtable.png",
					Datastore: "datastore.png",
					Firestore: "firestore.png",
					Memorystore: "memorystore.png",
					Spanner: "spanner.png",
					SQL: "sql.png",
				},
				devtools: {
					Build: "build.png",
					CodeForIntellij: "code-for-intellij.png",
					Code: "code.png",
					ContainerRegistry: "container-registry.png",
					GradleAppEnginePlugin: "gradle-app-engine-plugin.png",
					IdePlugins: "ide-plugins.png",
					MavenAppEnginePlugin: "maven-app-engine-plugin.png",
					Scheduler: "scheduler.png",
					SDK: "sdk.png",
					SourceRepositories: "source-repositories.png",
					Tasks: "tasks.png",
					TestLab: "test-lab.png",
					ToolsForEclipse: "tools-for-eclipse.png",
					ToolsForPowershell: "tools-for-powershell.png",
					ToolsForVisualStudio: "tools-for-visual-studio.png",
				},
				iot: {
					IotCore: "iot-core.png",
				},
				migration: {
					TransferAppliance: "transfer-appliance.png",
				},
				ml: {
					AdvancedSolutionsLab: "advanced-solutions-lab.png",
					AIHub: "ai-hub.png",
					AIPlatformDataLabelingService: "ai-platform-data-labeling-service.png",
					AIPlatform: "ai-platform.png",
					AutomlNaturalLanguage: "automl-natural-language.png",
					AutomlTables: "automl-tables.png",
					AutomlTranslation: "automl-translation.png",
					AutomlVideoIntelligence: "automl-video-intelligence.png",
					AutomlVision: "automl-vision.png",
					Automl: "automl.png",
					DialogFlowEnterpriseEdition: "dialog-flow-enterprise-edition.png",
					InferenceAPI: "inference-api.png",
					JobsAPI: "jobs-api.png",
					NaturalLanguageAPI: "natural-language-api.png",
					RecommendationsAI: "recommendations-ai.png",
					SpeechToText: "speech-to-text.png",
					TextToSpeech: "text-to-speech.png",
					TPU: "tpu.png",
					TranslationAPI: "translation-api.png",
					VideoIntelligenceAPI: "video-intelligence-api.png",
					VisionAPI: "vision-api.png",
				},
				network: {
					Armor: "armor.png",
					CDN: "cdn.png",
					DedicatedInterconnect: "dedicated-interconnect.png",
					DNS: "dns.png",
					ExternalIpAddresses: "external-ip-addresses.png",
					FirewallRules: "firewall-rules.png",
					LoadBalancing: "load-balancing.png",
					NAT: "nat.png",
					Network: "network.png",
					PartnerInterconnect: "partner-interconnect.png",
					PremiumNetworkTier: "premium-network-tier.png",
					Router: "router.png",
					Routes: "routes.png",
					StandardNetworkTier: "standard-network-tier.png",
					TrafficDirector: "traffic-director.png",
					VirtualPrivateCloud: "virtual-private-cloud.png",
					VPN: "vpn.png",
				},
				operations: {
					Monitoring: "monitoring.png",
				},
				security: {
					Iam: "iam.png",
					IAP: "iap.png",
					KeyManagementService: "key-management-service.png",
					ResourceManager: "resource-manager.png",
					SecurityCommandCenter: "security-command-center.png",
					SecurityScanner: "security-scanner.png",
				},
				storage: {
					Filestore: "filestore.png",
					PersistentDisk: "persistent-disk.png",
					Storage: "storage.png",
				}
			},
			generic: {
				blank: {
					Blank: "blank.png",
				},
				compute: {
					Rack: "rack.png",
				},
				database: {
					SQL: "sql.png",
				},
				device: {
					Mobile: "mobile.png",
					Tablet: "tablet.png",
				},
				network: {
					Firewall: "firewall.png",
					Router: "router.png",
					Subnet: "subnet.png",
					Switch: "switch.png",
					VPN: "vpn.png",
				},
				os: {
					Android: "android.png",
					Centos: "centos.png",
					IOS: "ios.png",
					LinuxGeneral: "linux-general.png",
					Suse: "suse.png",
					Ubuntu: "ubuntu.png",
					Windows: "windows.png",
				},
				place: {
					Datacenter: "datacenter.png",
				},
				storage: {
					Storage: "storage.png",
				},
				virtualization: {
					Virtualbox: "virtualbox.png",
					Vmware: "vmware.png",
					XEN: "xen.png",
				}
			},
			k8s: {
				chaos: {
					ChaosMesh: "chaos-mesh.png",
					LitmusChaos: "litmus-chaos.png",
				},
				clusterconfig: {
					HPA: "hpa.png",
					Limits: "limits.png",
					Quota: "quota.png",
				},
				compute: {
					Cronjob: "cronjob.png",
					Deploy: "deploy.png",
					DS: "ds.png",
					Job: "job.png",
					Pod: "pod.png",
					RS: "rs.png",
					STS: "sts.png",
				},
				controlplane: {
					API: "api.png",
					CCM: "c-c-m.png",
					CM: "c-m.png",
					KProxy: "k-proxy.png",
					Kubelet: "kubelet.png",
					Sched: "sched.png",
				},
				ecosystem: {
					ExternalDns: "external-dns.png",
					Helm: "helm.png",
					Krew: "krew.png",
					Kustomize: "kustomize.png",
				},
				group: {
					NS: "ns.png",
				},
				infra: {
					ETCD: "etcd.png",
					Master: "master.png",
					Node: "node.png",
				},
				network: {
					Ep: "ep.png",
					Ing: "ing.png",
					Netpol: "netpol.png",
					SVC: "svc.png",
				},
				others: {
					CRD: "crd.png",
					PSP: "psp.png",
				},
				podconfig: {
					CM: "cm.png",
					Secret: "secret.png",
				},
				rbac: {
					CRole: "c-role.png",
					CRB: "crb.png",
					Group: "group.png",
					RB: "rb.png",
					Role: "role.png",
					SA: "sa.png",
					User: "user.png",
				},
				storage: {
					PV: "pv.png",
					PVC: "pvc.png",
					SC: "sc.png",
					Vol: "vol.png",
				}
			},
			oci: {
				compute: {
					AutoscaleWhite: "autoscale-white.png",
					Autoscale: "autoscale.png",
					BMWhite: "bm-white.png",
					BM: "bm.png",
					ContainerWhite: "container-white.png",
					Container: "container.png",
					FunctionsWhite: "functions-white.png",
					Functions: "functions.png",
					InstancePoolsWhite: "instance-pools-white.png",
					InstancePools: "instance-pools.png",
					OCIRWhite: "ocir-white.png",
					OCIR: "ocir.png",
					OKEWhite: "oke-white.png",
					OKE: "oke.png",
					VMWhite: "vm-white.png",
					VM: "vm.png",
				},
				connectivity: {
					BackboneWhite: "backbone-white.png",
					Backbone: "backbone.png",
					CDNWhite: "cdn-white.png",
					CDN: "cdn.png",
					CustomerDatacenter: "customer-datacenter.png",
					CustomerDatacntrWhite: "customer-datacntr-white.png",
					CustomerPremiseWhite: "customer-premise-white.png",
					CustomerPremise: "customer-premise.png",
					DisconnectedRegionsWhite: "disconnected-regions-white.png",
					DisconnectedRegions: "disconnected-regions.png",
					DNSWhite: "dns-white.png",
					DNS: "dns.png",
					FastConnectWhite: "fast-connect-white.png",
					FastConnect: "fast-connect.png",
					NATGatewayWhite: "nat-gateway-white.png",
					NATGateway: "nat-gateway.png",
					VPNWhite: "vpn-white.png",
					VPN: "vpn.png",
				},
				database: {
					AutonomousWhite: "autonomous-white.png",
					Autonomous: "autonomous.png",
					BigdataServiceWhite: "bigdata-service-white.png",
					BigdataService: "bigdata-service.png",
					DatabaseServiceWhite: "database-service-white.png",
					DatabaseService: "database-service.png",
					DataflowApacheWhite: "dataflow-apache-white.png",
					DataflowApache: "dataflow-apache.png",
					DcatWhite: "dcat-white.png",
					Dcat: "dcat.png",
					DisWhite: "dis-white.png",
					Dis: "dis.png",
					DMSWhite: "dms-white.png",
					DMS: "dms.png",
					ScienceWhite: "science-white.png",
					Science: "science.png",
					StreamWhite: "stream-white.png",
					Stream: "stream.png",
				},
				devops: {
					APIGatewayWhite: "api-gateway-white.png",
					APIGateway: "api-gateway.png",
					APIServiceWhite: "api-service-white.png",
					APIService: "api-service.png",
					ResourceMgmtWhite: "resource-mgmt-white.png",
					ResourceMgmt: "resource-mgmt.png",
				},
				governance: {
					AuditWhite: "audit-white.png",
					Audit: "audit.png",
					CompartmentsWhite: "compartments-white.png",
					Compartments: "compartments.png",
					GroupsWhite: "groups-white.png",
					Groups: "groups.png",
					LoggingWhite: "logging-white.png",
					Logging: "logging.png",
					OCIDWhite: "ocid-white.png",
					OCID: "ocid.png",
					PoliciesWhite: "policies-white.png",
					Policies: "policies.png",
					TaggingWhite: "tagging-white.png",
					Tagging: "tagging.png",
				},
				monitoring: {
					AlarmWhite: "alarm-white.png",
					Alarm: "alarm.png",
					EmailWhite: "email-white.png",
					Email: "email.png",
					EventsWhite: "events-white.png",
					Events: "events.png",
					HealthCheckWhite: "health-check-white.png",
					HealthCheck: "health-check.png",
					NotificationsWhite: "notifications-white.png",
					Notifications: "notifications.png",
					QueueWhite: "queue-white.png",
					Queue: "queue.png",
					SearchWhite: "search-white.png",
					Search: "search.png",
					TelemetryWhite: "telemetry-white.png",
					Telemetry: "telemetry.png",
					WorkflowWhite: "workflow-white.png",
					Workflow: "workflow.png",
				},
				network: {
					DrgWhite: "drg-white.png",
					Drg: "drg.png",
					FirewallWhite: "firewall-white.png",
					Firewall: "firewall.png",
					InternetGatewayWhite: "internet-gateway-white.png",
					InternetGateway: "internet-gateway.png",
					LoadBalancerWhite: "load-balancer-white.png",
					LoadBalancer: "load-balancer.png",
					RouteTableWhite: "route-table-white.png",
					RouteTable: "route-table.png",
					SecurityListsWhite: "security-lists-white.png",
					SecurityLists: "security-lists.png",
					ServiceGatewayWhite: "service-gateway-white.png",
					ServiceGateway: "service-gateway.png",
					VcnWhite: "vcn-white.png",
					Vcn: "vcn.png",
				},
				security: {
					CloudGuardWhite: "cloud-guard-white.png",
					CloudGuard: "cloud-guard.png",
					DDOSWhite: "ddos-white.png",
					DDOS: "ddos.png",
					EncryptionWhite: "encryption-white.png",
					Encryption: "encryption.png",
					IDAccessWhite: "id-access-white.png",
					IDAccess: "id-access.png",
					KeyManagementWhite: "key-management-white.png",
					KeyManagement: "key-management.png",
					MaxSecurityZoneWhite: "max-security-zone-white.png",
					MaxSecurityZone: "max-security-zone.png",
					VaultWhite: "vault-white.png",
					Vault: "vault.png",
					WAFWhite: "waf-white.png",
					WAF: "waf.png",
				},
				storage: {
					BackupRestoreWhite: "backup-restore-white.png",
					BackupRestore: "backup-restore.png",
					BlockStorageCloneWhite: "block-storage-clone-white.png",
					BlockStorageClone: "block-storage-clone.png",
					BlockStorageWhite: "block-storage-white.png",
					BlockStorage: "block-storage.png",
					BucketsWhite: "buckets-white.png",
					Buckets: "buckets.png",
					DataTransferWhite: "data-transfer-white.png",
					DataTransfer: "data-transfer.png",
					ElasticPerformanceWhite: "elastic-performance-white.png",
					ElasticPerformance: "elastic-performance.png",
					FileStorageWhite: "file-storage-white.png",
					FileStorage: "file-storage.png",
					ObjectStorageWhite: "object-storage-white.png",
					ObjectStorage: "object-storage.png",
					StorageGatewayWhite: "storage-gateway-white.png",
					StorageGateway: "storage-gateway.png",
				}
			},
			onprem: {
				aggregator: {
					Fluentd: "fluentd.png",
					Vector: "vector.png",
				},
				analytics: {
					Beam: "beam.png",
					Databricks: "databricks.png",
					Dbt: "dbt.png",
					Flink: "flink.png",
					Hadoop: "hadoop.png",
					Hive: "hive.png",
					Metabase: "metabase.png",
					Norikra: "norikra.png",
					Powerbi: "powerbi.png",
					Presto: "presto.png",
					Singer: "singer.png",
					Spark: "spark.png",
					Storm: "storm.png",
					Superset: "superset.png",
					Tableau: "tableau.png",
				},
				auth: {
					Boundary: "boundary.png",
					BuzzfeedSso: "buzzfeed-sso.png",
					Oauth2Proxy: "oauth2-proxy.png",
				},
				cd: {
					Spinnaker: "spinnaker.png",
					TektonCli: "tekton-cli.png",
					Tekton: "tekton.png",
				},
				certificates: {
					CertManager: "cert-manager.png",
					LetsEncrypt: "lets-encrypt.png",
				},
				ci: {
					Circleci: "circleci.png",
					Concourseci: "concourseci.png",
					Droneci: "droneci.png",
					GithubActions: "github-actions.png",
					Gitlabci: "gitlabci.png",
					Jenkins: "jenkins.png",
					Teamcity: "teamcity.png",
					Travisci: "travisci.png",
					Zuulci: "zuulci.png",
				},
				client: {
					Client: "client.png",
					User: "user.png",
					Users: "users.png",
				},
				compute: {
					Nomad: "nomad.png",
					Server: "server.png",
				},
				container: {
					Containerd: "containerd.png",
					Crio: "crio.png",
					Docker: "docker.png",
					Firecracker: "firecracker.png",
					Gvisor: "gvisor.png",
					Lxc: "lxc.png",
					Rkt: "rkt.png",
				},
				database: {
					Cassandra: "cassandra.png",
					Clickhouse: "clickhouse.png",
					Cockroachdb: "cockroachdb.png",
					Couchbase: "couchbase.png",
					Couchdb: "couchdb.png",
					Dgraph: "dgraph.png",
					Druid: "druid.png",
					Hbase: "hbase.png",
					Influxdb: "influxdb.png",
					Janusgraph: "janusgraph.png",
					Mariadb: "mariadb.png",
					Mongodb: "mongodb.png",
					Mssql: "mssql.png",
					Mysql: "mysql.png",
					Neo4J: "neo4j.png",
					Oracle: "oracle.png",
					Postgresql: "postgresql.png",
					Scylla: "scylla.png",
				},
				dns: {
					Coredns: "coredns.png",
					Powerdns: "powerdns.png",
				},
				etl: {
					Embulk: "embulk.png",
				},
				gitops: {
					Argocd: "argocd.png",
					Flagger: "flagger.png",
					Flux: "flux.png",
				},
				groupware: {
					Nextcloud: "nextcloud.png",
				},
				iac: {
					Ansible: "ansible.png",
					Atlantis: "atlantis.png",
					Awx: "awx.png",
					Terraform: "terraform.png",
				},
				identity: {
					Dex: "dex.png",
				},
				inmemory: {
					Aerospike: "aerospike.png",
					Hazelcast: "hazelcast.png",
					Memcached: "memcached.png",
					Redis: "redis.png",
				},
				logging: {
					Fluentbit: "fluentbit.png",
					Graylog: "graylog.png",
					Loki: "loki.png",
					Rsyslog: "rsyslog.png",
					SyslogNg: "syslog-ng.png",
				},
				mlops: {
					Polyaxon: "polyaxon.png",
				},
				monitoring: {
					Cortex: "cortex.png",
					Datadog: "datadog.png",
					Grafana: "grafana.png",
					Humio: "humio.png",
					Newrelic: "newrelic.png",
					PrometheusOperator: "prometheus-operator.png",
					Prometheus: "prometheus.png",
					Sentry: "sentry.png",
					Splunk: "splunk.png",
					Thanos: "thanos.png",
					Zabbix: "zabbix.png",
				},
				network: {
					Ambassador: "ambassador.png",
					Apache: "apache.png",
					Bind9: "bind-9.png",
					Caddy: "caddy.png",
					Consul: "consul.png",
					Envoy: "envoy.png",
					Etcd: "etcd.png",
					Glassfish: "glassfish.png",
					Gunicorn: "gunicorn.png",
					Haproxy: "haproxy.png",
					Internet: "internet.png",
					Istio: "istio.png",
					Jbossas: "jbossas.png",
					Jetty: "jetty.png",
					Kong: "kong.png",
					Linkerd: "linkerd.png",
					Nginx: "nginx.png",
					Ocelot: "ocelot.png",
					OpenServiceMesh: "open-service-mesh.png",
					Opnsense: "opnsense.png",
					Pfsense: "pfsense.png",
					Pomerium: "pomerium.png",
					Powerdns: "powerdns.png",
					Tomcat: "tomcat.png",
					Traefik: "traefik.png",
					Vyos: "vyos.png",
					Wildfly: "wildfly.png",
					Zookeeper: "zookeeper.png",
				},
				proxmox: {
					Pve: "pve.png",
				},
				queue: {
					Activemq: "activemq.png",
					Celery: "celery.png",
					Kafka: "kafka.png",
					Nats: "nats.png",
					Rabbitmq: "rabbitmq.png",
					Zeromq: "zeromq.png",
				},
				search: {
					Solr: "solr.png",
				},
				security: {
					Bitwarden: "bitwarden.png",
					Trivy: "trivy.png",
					Vault: "vault.png",
				},
				storage: {
					CephOsd: "ceph-osd.png",
					Ceph: "ceph.png",
					Glusterfs: "glusterfs.png",
				},
				tracing: {
					Jaeger: "jaeger.png",
				},
				vcs: {
					Git: "git.png",
					Github: "github.png",
					Gitlab: "gitlab.png",
				},
				workflow: {
					Airflow: "airflow.png",
					Digdag: "digdag.png",
					Kubeflow: "kubeflow.png",
					Nifi: "nifi.png",
				}
			},
			openstack: {
				apiproxies: {
					EC2API: "ec2api.png",
				},
				applicationlifecycle: {
					Freezer: "freezer.png",
					Masakari: "masakari.png",
					Murano: "murano.png",
					Solum: "solum.png",
				},
				baremetal: {
					Cyborg: "cyborg.png",
					Ironic: "ironic.png",
				},
				billing: {
					Cloudkitty: "cloudkitty.png",
				},
				compute: {
					Nova: "nova.png",
					Qinling: "qinling.png",
					Zun: "zun.png",
				},
				containerservices: {
					Kuryr: "kuryr.png",
				},
				deployment: {
					Ansible: "ansible.png",
					Charms: "charms.png",
					Chef: "chef.png",
					Helm: "helm.png",
					Kolla: "kolla.png",
					Tripleo: "tripleo.png",
				},
				frontend: {
					Horizon: "horizon.png",
				},
				monitoring: {
					Monasca: "monasca.png",
					Telemetry: "telemetry.png",
				},
				multiregion: {
					Tricircle: "tricircle.png",
				},
				networking: {
					Designate: "designate.png",
					Neutron: "neutron.png",
					Octavia: "octavia.png",
				},
				nfv: {
					Tacker: "tacker.png",
				},
				optimization: {
					Congress: "congress.png",
					Rally: "rally.png",
					Vitrage: "vitrage.png",
					Watcher: "watcher.png",
				},
				orchestration: {
					Blazar: "blazar.png",
					Heat: "heat.png",
					Mistral: "mistral.png",
					Senlin: "senlin.png",
					Zaqar: "zaqar.png",
				},
				packaging: {
					LOCI: "loci.png",
					Puppet: "puppet.png",
					RPM: "rpm.png",
				},
				sharedservices: {
					Barbican: "barbican.png",
					Glance: "glance.png",
					Karbor: "karbor.png",
					Keystone: "keystone.png",
					Searchlight: "searchlight.png",
				},
				storage: {
					Cinder: "cinder.png",
					Manila: "manila.png",
					Swift: "swift.png",
				},
				user: {
					Openstackclient: "openstackclient.png",
				},
				workloadprovisioning: {
					Magnum: "magnum.png",
					Sahara: "sahara.png",
					Trove: "trove.png",
				}
			},
			outscale: {
				compute: {
					Compute: "compute.png",
					DirectConnect: "direct-connect.png",
				},
				network: {
					ClientVpn: "client-vpn.png",
					InternetService: "internet-service.png",
					LoadBalancer: "load-balancer.png",
					NatService: "nat-service.png",
					Net: "net.png",
					SiteToSiteVpng: "site-to-site-vpng.png",
				},
				security: {
					Firewall: "firewall.png",
					IdentityAndAccessManagement: "identity-and-access-management.png",
				},
				storage: {
					SimpleStorageService: "simple-storage-service.png",
					Storage: "storage.png",
				}
			},
			programming: {
				flowchart: {
					Action: "action.png",
					Collate: "collate.png",
					Database: "database.png",
					Decision: "decision.png",
					Delay: "delay.png",
					Display: "display.png",
					Document: "document.png",
					InputOutput: "input-output.png",
					Inspection: "inspection.png",
					InternalStorage: "internal-storage.png",
					LoopLimit: "loop-limit.png",
					ManualInput: "manual-input.png",
					ManualLoop: "manual-loop.png",
					Merge: "merge.png",
					MultipleDocuments: "multiple-documents.png",
					OffPageConnectorLeft: "off-page-connector-left.png",
					OffPageConnectorRight: "off-page-connector-right.png",
					Or: "or.png",
					PredefinedProcess: "predefined-process.png",
					Preparation: "preparation.png",
					Sort: "sort.png",
					StartEnd: "start-end.png",
					StoredData: "stored-data.png",
					SummingJunction: "summing-junction.png",
				},
				framework: {
					Angular: "angular.png",
					Backbone: "backbone.png",
					Django: "django.png",
					Ember: "ember.png",
					Fastapi: "fastapi.png",
					Flask: "flask.png",
					Flutter: "flutter.png",
					Laravel: "laravel.png",
					Micronaut: "micronaut.png",
					Rails: "rails.png",
					React: "react.png",
					Spring: "spring.png",
					Vue: "vue.png",
				},
				language: {
					Bash: "bash.png",
					C: "c.png",
					Cpp: "cpp.png",
					Csharp: "csharp.png",
					Dart: "dart.png",
					Elixir: "elixir.png",
					Erlang: "erlang.png",
					Go: "go.png",
					Java: "java.png",
					Javascript: "javascript.png",
					Kotlin: "kotlin.png",
					Matlab: "matlab.png",
					Nodejs: "nodejs.png",
					Php: "php.png",
					Python: "python.png",
					R: "r.png",
					Ruby: "ruby.png",
					Rust: "rust.png",
					Scala: "scala.png",
					Swift: "swift.png",
					Typescript: "typescript.png",
				}
			},
			saas: {
				alerting: {
					Newrelic: "newrelic.png",
					Opsgenie: "opsgenie.png",
					Pushover: "pushover.png",
				},
				analytics: {
					Snowflake: "snowflake.png",
					Stitch: "stitch.png",
				},
				cdn: {
					Akamai: "akamai.png",
					Cloudflare: "cloudflare.png",
				},
				chat: {
					Discord: "discord.png",
					Mattermost: "mattermost.png",
					RocketChat: "rocket-chat.png",
					Slack: "slack.png",
					Teams: "teams.png",
					Telegram: "telegram.png",
				},
				filesharing: {
					Nextcloud: "nextcloud.png",
				},
				identity: {
					Auth0: "auth0.png",
					Okta: "okta.png",
				},
				logging: {
					Datadog: "datadog.png",
					Newrelic: "newrelic.png",
					Papertrail: "papertrail.png",
				},
				media: {
					Cloudinary: "cloudinary.png",
				},
				recommendation: {
					Recombee: "recombee.png",
				},
				social: {
					Facebook: "facebook.png",
					Twitter: "twitter.png",
				}
			}
		};
		
		///////////////////////////////////////////////////////////////////////////
		// https://github.com/mingrammer/diagrams/blob/master/config.py
		
		var ALIASES = {
			"onprem": {
				"analytics": {
					"Powerbi": "PowerBI"
				},
				"ci": {
					"Circleci": "CircleCI",
					"Concourseci": "ConcourseCI",
					"Droneci": "DroneCI",
					"Gitlabci": "GitlabCI",
					"Travisci": "TravisCI",
					"Teamcity": "TC",
					"Zuulci": "ZuulCI",
				},
				"container": {
					"Lxc": "LXC",
					"Rkt": "RKT",
				},
				"database": {
					"Clickhouse": "ClickHouse",
					"Cockroachdb": "CockroachDB",
					"Couchdb": "CouchDB",
					"Hbase": "HBase",
					"Influxdb": "InfluxDB",
					"Janusgraph": "JanusGraph",
					"Mariadb": "MariaDB",
					"Mongodb": "MongoDB",
					"Mssql": "MSSQL",
					"Mysql": "MySQL",
					"Postgresql": "PostgreSQL",
				},
				"gitops": {
					"Argocd": "ArgoCD",
				},
				"logging": {
					"Fluentbit": "FluentBit",
					"Rsyslog": "RSyslog",
				},
				"network": {
					"Etcd": "ETCD",
					"Haproxy": "HAProxy",
					"OpenServiceMesh": "OSM",
					"Opnsense": "OPNSense",
					"Pfsense": "PFSense",
					"Vyos": "VyOS"
				},
				"proxmox": {
					"Pve": "ProxmoxVE",
				},
				"queue": {
					"Activemq": "ActiveMQ",
					"Rabbitmq": "RabbitMQ",
					"Zeromq": "ZeroMQ",
				},
				"storage": {
					"Ceph": "CEPH",
					"CephOsd": "CEPH_OSD",
				},
				"workflow": {
					"Kubeflow": "KubeFlow",
					"Nifi": "NiFi",
				}
			},
			"aws": {
				"analytics": {
					"ElasticsearchService": "ES",
				},
				"business": {
					"AlexaForBusiness": "A4B"
				},
				"blockchain": {
					"QuantumLedgerDatabaseQldb": "QLDB"
				},
				"compute": {
					"ApplicationAutoScaling": "AutoScaling",
					"EC2Ami": "AMI",
					"EC2ContainerRegistry": "ECR",
					"ElasticBeanstalk": "EB",
					"ElasticContainerService": "ECS",
					"ElasticKubernetesService": "EKS",
					"ServerlessApplicationRepository": "SAR",
				},
				"database": {
					"DatabaseMigrationService": "DMS",
					"DocumentdbMongodbCompatibility": "DocumentDB",
					"DynamodbDax": "DAX",
					"DynamodbGlobalSecondaryIndex": "DynamodbGSI",
					"Database": "DB",
					"Dynamodb": "DDB",
					"Elasticache": "ElastiCache",
					"QuantumLedgerDatabaseQldb": "QLDB",
				},
				"devtools": {
					"CommandLineInterface": "CLI",
					"DeveloperTools": "DevTools",
				},
				"engagement": {
					"SimpleEmailServiceSes": "SES",
				},
				"general": {
					"GenericOfficeBuilding": "OfficeBuilding",
				},
				"integration": {
					"SimpleNotificationServiceSns": "SNS",
					"SimpleQueueServiceSqs": "SQS",
					"StepFunctions": "SF",
				},
				"iot": {
					"Freertos": "FreeRTOS",
					"IotHardwareBoard": "IotBoard",
				},
				"management": {
					"SystemsManager": "SSM",
					"SystemsManagerParameterStore": "ParameterStore",
				},
				"migration": {
					"ApplicationDiscoveryService": "ADS",
					"CloudendureMigration": "CEM",
					"DatabaseMigrationService": "DMS",
					"MigrationAndTransfer": "MAT",
					"ServerMigrationService": "SMS",
				},
				"ml": {
					"DeepLearningContainers": "DLC",
				},
				"network": {
					"CloudFront": "CF",
					"ElasticLoadBalancing": "ELB",
					"ElbApplicationLoadBalancer": "ALB",
					"ElbClassicLoadBalancer": "CLB",
					"ElbNetworkLoadBalancer": "NLB",
					"GlobalAccelerator": "GAX",
				},
				"security": {
					"CertificateManager": "ACM",
					"Cloudhsm": "CloudHSM",
					"DirectoryService": "DS",
					"FirewallManager": "FMS",
					"IdentityAndAccessManagementIamAccessAnalyzer": "IAMAccessAnalyzer",
					"IdentityAndAccessManagementIamAWSSts": "IAMAWSSts",
					"IdentityAndAccessManagementIamPermissions": "IAMPermissions",
					"IdentityAndAccessManagementIamRole": "IAMRole",
					"IdentityAndAccessManagementIam": "IAM",
					"KeyManagementService": "KMS",
					"ResourceAccessManager": "RAM",
				},
				"storage": {
					"CloudendureDisasterRecovery": "CDR",
					"ElasticBlockStoreEBS": "EBS",
					"ElasticFileSystemEFS": "EFS",
					"Fsx": "FSx",
					"SimpleStorageServiceS3": "S3",
				},
			},
			"azure": {
				"compute": {
					"ContainerRegistries": "ACR",
					"KubernetesServices": "AKS",
					"VMScaleSet": "VMSS"
				},
			},
			"gcp": {
				"analytics": {
					"Bigquery": "BigQuery",
					"Pubsub": "PubSub",
				},
				"compute": {
					"AppEngine": "GAE",
					"Functions": "GCF",
					"ComputeEngine": "GCE",
					"KubernetesEngine": "GKE",
				},
				"database": {
					"Bigtable": "BigTable",
				},
				"devtools": {
					"ContainerRegistry": "GCR",
				},
				"ml": {
					"Automl": "AutoML",
					"NaturalLanguageAPI": "NLAPI",
					"SpeechToText": "STT",
					"TextToSpeech": "TTS",
				},
				"network": {
					"VirtualPrivateCloud": "VPC"
				},
				"security": {
					"KeyManagementService": "KMS",
					"SecurityCommandCenter": "SCC",
				},
				"storage": {
					"Storage": "GCS",
				},
			},
			"firebase": {
				"grow": {
					"Messaging": "FCM"
				}
			},
			"k8s": {
				"clusterconfig": {
					"Limits": "LimitRange",
					"HPA": "HorizontalPodAutoscaler",
				},
				"compute": {
					"Deploy": "Deployment",
					"DS": "DaemonSet",
					"RS": "ReplicaSet",
					"STS": "StatefulSet"
				},
				"controlplane": {
					"API": "APIServer",
					"CM": "ControllerManager",
					"KProxy": "KubeProxy",
					"Sched": "Scheduler",
				},
				"group": {
					"NS": "Namespace",
				},
				"network": {
					"Ep": "Endpoint",
					"Ing": "Ingress",
					"Netpol": "NetworkPolicy",
					"SVC": "Service",
				},
				"podconfig": {
					"CM": "ConfigMap",
				},
				"rbac": {
					"CRole": "ClusterRole",
					"CRB": "ClusterRoleBinding",
					"RB": "RoleBinding",
					"SA": "ServiceAccount",
				},
				"storage": {
					"PV": "PersistentVolume",
					"PVC": "PersistentVolumeClaim",
					"SC": "StorageClass",
					"Vol": "Volume",
				},
			},
			"alibabacloud": {
				"application": {
					"LogService": "SLS",
					"MessageNotificationService": "MNS",
					"PerformanceTestingService": "PTS",
					"SmartConversationAnalysis": "SCA",
				},
				"compute": {
					"AutoScaling": "ESS",
					"ElasticComputeService": "ECS",
					"ElasticContainerInstance": "ECI",
					"ElasticHighPerformanceComputing": "EHPC",
					"FunctionCompute": "FC",
					"OperationOrchestrationService": "OOS",
					"ResourceOrchestrationService": "ROS",
					"ServerLoadBalancer": "SLB",
					"ServerlessAppEngine": "SAE",
					"SimpleApplicationServer": "SAS",
					"WebAppService": "WAS",
				},
				"database": {
					"DataManagementService": "DMS",
					"DataTransmissionService": "DTS",
					"DatabaseBackupService": "DBS",
					"DisributeRelationalDatabaseService": "DRDS",
					"GraphDatabaseService": "GDS",
					"RelationalDatabaseService": "RDS",
				},
				"network": {
					"CloudEnterpriseNetwork": "CEN",
					"ElasticIpAddress": "EIP",
					"ServerLoadBalancer": "SLB",
					"VirtualPrivateCloud": "VPC",
				},
				"security": {
					"AntiBotService": "ABS",
					"AntifraudService": "AS",
					"CloudFirewall": "CFW",
					"ContentModeration": "CM",
					"DataEncryptionService": "DES",
					"WebApplicationFirewall": "WAF",
				},
				"storage": {
					"FileStorageHdfs": "HDFS",
					"FileStorageNas": "NAS",
					"HybridBackupRecovery": "HBR",
					"HybridCloudDisasterRecovery": "HDR",
					"ObjectStorageService": "OSS",
					"ObjectTableStore": "OTS",
				}
			},
			"oci": {
				"compute": {
					"VM": "VirtualMachine",
					"VMWhite": "VirtualMachineWhite",
					"BM": "BareMetal",
					"BMWhite": "BareMetalWhite",
					"OCIR": "OCIRegistry",
					"OCIRWhite": "OCIRegistryWhite",
					"OKE": "ContainerEngine",
					"OKEWhite": "ContainerEngineWhite",
				},
				"database": {
					"Autonomous": "ADB",
					"AutonomousWhite": "ADBWhite",
					"DatabaseService": "DBService",
					"DatabaseServiceWhite": "DBServiceWhite",
				}
			},
			"programming": {
				"framework": {
					"Fastapi": "FastAPI"
				},
				"language": {
					"Javascript": "JavaScript",
					"Nodejs": "NodeJS",
					"Php": "PHP",
					"Typescript": "TypeScript"
				},
			},
			"saas": {
				"logging": {
					"Datadog": "DataDog",
					"Newrelic": "NewRelic"
				}
			},
			"elastic": {
				"elasticsearch": {
					"Logstash": "LogStash",
				}
			},
			"outscale": {
				"Osc": "OSC",
			},
			"generic": {},
			"openstack": {
				"user": {
					"Openstackclient": "OpenStackClient",
				},
				"billing": {
					"Cloudkitty": "CloudKitty",
				},
				"deployment": {
					"Kolla": "KollaAnsible",
					"Tripleo": "TripleO",
				}
			}
		}
		
		///////////////////////////////////////////////////////////////////////////
		
		var additional = {
			program: {
				// https://github.com/alrra/browser-logos/blob/main/src/README.md
				browser: {
					AndroidWebView: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/android-webview/android-webview_256x256.png",
					AndroidWebViewBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/android-webview-beta/android-webview-beta_256x256.png",
					AndroidWebViewDev: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/android-webview-dev/android-webview-dev_256x256.png",
					AndroidWebViewCanary: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/android-webview-canary/android-webview-canary_256x256.png",
					Avant: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/avant/avant_256x256.png",
					Basilisk: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/basilisk/basilisk_256x256.png",
					Brave: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/brave/brave_256x256.png",
					BraveBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/brave-beta/brave-beta_256x256.png",
					BraveDeveloper: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/brave-dev/brave-dev_256x256.png",
					BraveNightly: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/brave-nightly/brave-nightly_256x256.png",
					browsh: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/browsh/browsh_256x256.png",
					Chrome: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chrome/chrome_256x256.png",
					ChromeBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chrome-beta/chrome-beta_256x256.png",
					ChromeDev: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chrome-dev/chrome-dev_256x256.png",
					ChromeCanary: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chrome-canary/chrome-canary_256x256.png",
					ChromeDevTools: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chrome-devtools/chrome-devtools_256x256.png",
					Chromium: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/chromium/chromium_256x256.png",
					CốcCốc: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/c%E1%BB%91c-c%E1%BB%91c/c%E1%BB%91c-c%E1%BB%91c_256x256.png",
					Dolphin: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/dolphin/dolphin_256x256.png",
					MicrosoftEdge: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/edge/edge_256x256.png",
					MicrosoftEdgeBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/edge-beta/edge-beta_256x256.png",
					MicrosoftEdgeDev: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/edge-dev/edge-dev_256x256.png",
					MicrosoftEdgeCanary: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/edge-canary/edge-canary_256x256.png",
					Electron: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/electron/electron_256x256.png",
					Epic: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/epic/epic.png",
					Falkon: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/falkon/falkon_256x256.png",
					Firefox: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/firefox/firefox_256x256.png",
					FirefoxBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/firefox-beta/firefox-beta_256x256.png",
					FirefoxLite: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/firefox-lite/firefox-lite_256x256.png",
					FirefoxDeveloperEdition: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/firefox-developer-edition/firefox-developer-edition_256x256.png",
					FirefoxNightly: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/firefox-nightly/firefox-nightly_256x256.png",
					FirefoxReality: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/firefox-reality/firefox-reality_256x256.png",
					GeckoView: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/geckoview/geckoview_256x256.png",
					HermesJavaScriptEngine: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/hermes/hermes_256x256.png",
					IceCat: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/icecat/icecat_256x256.png",
					jsdom: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/jsdom/jsdom_256x256.png",
					Konqueror: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/konqueror/konqueror_256x256.png",
					Maxthon: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/maxthon/maxthon_256x256.png",
					Midori: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/midori/midori_256x256.png",
					NetSurf: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/netsurf/netsurf_256x256.png",
					NWjs: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/nw.js/nw.js_256x256.png",
					Opera: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera/opera_256x256.png",
					OperaBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-beta/opera-beta_256x256.png",
					OperaDeveloper: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-developer/opera-developer_256x256.png",
					OperaGX: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-gx/opera-gx_256x256.png",
					OperaMini: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-mini/opera-mini_256x256.png",
					OperaMiniBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-mini-beta/opera-mini-beta_256x256.png",
					OperaNeon: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-neon/opera-neon_256x256.png",
					OperaTouch: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/opera-touch/opera-touch_256x256.png",
					Otter: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/otter/otter_256x256.png",
					Puffin: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/puffin/puffin_256x256.png",
					Safari: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/safari/safari_256x256.png",
					SafariTechnologyPreview: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/safari-technology-preview/safari-technology-preview_256x256.png",
					SafariforIOS: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/safari-ios/safari-ios_256x256.png",
					SamsungInternet: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/samsung-internet/samsung-internet_256x256.png",
					SamsungInternetBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/samsung-internet-beta/samsung-internet-beta_256x256.png",
					SeaMonkey: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/seamonkey/seamonkey_256x256.png",
					Servo: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/servo/servo_256x256.png",
					Silk: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/silk/silk_256x256.png",
					SogouMobile: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/sogou-mobile/sogou-mobile_256x256.png",
					Tor: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/tor/tor_256x256.png",
					TorAlpha: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/tor-alpha/tor-alpha_256x256.png",
					TorNightly: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/tor-nightly/tor-nightly_256x256.png",
					SpiderMonkeyJavaScriptEngine: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/spidermonkey/spidermonkey_256x256.png",
					UC: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/uc/uc_256x256.png",
					UCMini: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/uc-mini/uc-mini_256x256.png",
					V8JavaScriptEngine: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/v8/v8_256x256.png",
					V8sIgnitionInterpreter: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/v8-ignition/v8-ignition_256x256.png",
					V8sLiftoffBaselineCompilerForWebAssembly: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/v8-liftoff/v8-liftoff_256x256.png",
					V8sOrinocoGarbageCollector: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/v8-orinoco/v8-orinoco_256x256.png",
					V8sTurboFanOptimizingCompiler: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/v8-turbofan/v8-turbofan_256x256.png",
					Vivaldi: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/vivaldi/vivaldi_256x256.png",
					VivaldiSnapshot: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/vivaldi-snapshot/vivaldi-snapshot.png",
					WebEpiphany: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/web/web_256x256.png",
					EpiphanyTechnologyPreview: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/epiphany-technology-preview/epiphany-technology-preview_256x256.png",
					WebKitengine: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/webkit/webkit_256x256.png",
					WebKitNightly: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/webkit-nightly/webkit-nightly_256x256.png",
					Yandex: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/yandex/yandex_256x256.png",
					YandexBeta: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/yandex-beta/yandex-beta_256x256.png",
					YandexAlpha: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/yandex-alpha/yandex-alpha_256x256.png",
					YandexLite: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/yandex-lite/yandex-lite_256x256.png",
				},
				// https://github.com/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio
				office365: {
					Access: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Access.svg",
					Bookings: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Bookings.svg",
					Calendar: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Calendar.svg",
					Delve: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Delve.svg",
					Document: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Document.svg",
					ExcelDoc: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Excel-Doc.svg",
					Excel: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Excel.svg",
					Exchange: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Exchange.svg",
					Fluid: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Fluid.svg",
					Folder: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Folder.svg",
					FormDoc: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Form-Doc.svg",
					Forms: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Forms.svg",
					Kaizala: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Kaizala.svg",
					ListsD: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Lists-D.svg",
					Lists: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Lists.svg",
					Myanalytics: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Myanalytics.svg",
					OfPrivacy: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Of-Privacy.svg",
					Office365: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Office-365.svg",
					Onedrive: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Onedrive.svg",
					OnenoteDoc: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Onenote-Doc.svg",
					Onenote: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Onenote.svg",
					Outlook: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Outlook.svg",
					Pdf: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Pdf.svg",
					Planner: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Planner.svg",
					PowerpointDoc: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Powerpoint-Doc.svg",
					Powerpoint: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Powerpoint.svg",
					ProjectDoc: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Project-Doc.svg",
					Project: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Project.svg",
					Publisher: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Publisher.svg",
					Rewards: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Rewards.svg",
					Sharepoint: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Sharepoint.svg",
					SkypeForBusiness: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Skype-For-Business.svg",
					Stream: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Stream.svg",
					Sway: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Sway.svg",
					Teams: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Teams.svg",
					ToDo: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/To-Do.svg",
					VisioDoc: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Visio-Doc.svg",
					Visio: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Visio.svg",
					Whiteboard: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Whiteboard.svg",
					Word: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Word.svg",
					Yammer: "https://cdn.jsdelivr.net/gh/sandroasp/Microsoft-Integration-and-Azure-Stencils-Pack-for-Visio/Office%20365/SVG/Yammer.svg",
				}
			}
		}
		
		///////////////////////////////////////////////////////////////////////////
		
		function merge(src, node) {
			for (var x in node) {
				var aliase = node[x];
				if (aliase) {
					if (typeof aliase == "string") {
						var obj = src[x];
						if (obj) {
							src[aliase] = obj;
						}
					} else {
						if (src[x]) {
							merge(src[x], node[x]);
						} else {
							src[x] = node[x];
						}
					}
				}
			}
		}
		
		merge(resources, ALIASES);
		
		merge(resources, additional);
		
		return resources;
	}
	
})));




