//     sysdiagram.js 0.1.0
//     https://succeun.github.io/sysdiagram
//     Copyright (c) 2021 Jeong-Ho, Eun Licensed under the MIT license.

var sysdiagram = sysdiagram || (function() {
	'use strict';
	
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
			if (node.type == 'edge') {
				var edge = node;
				me.edgeattrs = edge.attrs();
				edge.srcNode = me;
			} else if (node.type == 'array_node') {
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
		if (Array.isArray(node)) {	// natvie array
			node = ArrayNode(node);
		}
		
		if (node.type == 'edge') {
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
				}
			}
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
		if (!isLoadedResources) {
			if (sysdiagram_resources) {
				loadResources(sysdiagram_resources, sysdiagram_resources.baseUrl);
			}
		}
		
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
	
	function initialize(attributes, callbackFunc) {
		attributes = attributes || {};
		var selector = attributes.selector || defaultAttrs.selector;
		var startOnLoad = (attributes.startOnLoad != null) ? attributes.startOnLoad : defaultAttrs.startOnLoad;
		if (startOnLoad) {
			window.addEventListener('DOMContentLoaded', function(event) {
				init(attributes, selector);
			});
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
			sysdiagram.render(diagram, code, {}, function(element, graphviz) {
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
		if (resourceJson) {
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
	
	///////////////////////////////////////////////////////////////////////////
	
	return {
		initialize: initialize,
		init: init,
		loadResources: loadResources,
		attributes: defaultAttrs,
		generate: generate,
		render: render,
		toImage: toImage,
		diagrams: diagrams
	};
})();
