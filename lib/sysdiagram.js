//! sysdiagram.js
//! version : {{{version}}}
//! authors : Jeong-Ho, Eun
//! license : MIT
//! https://succeun.github.io/sysdiagram

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.sysdiagram = factory()
}(this, (function () { 'use strict';
	
	// Ansi Color for Console log
	var ansi = {
		reset: "\x1b[0m", 
		bright: "\x1b[1m",
		dim: "\x1b[2m",
		underscore: "\x1b[4m",
		blink: "\x1b[5m",
		reverse: "\x1b[7m",
		hidden: "\x1b[8m",
		black: "\x1b[30m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		magenta: "\x1b[35m",
		cyan: "\x1b[36m",
		white: "\x1b[37m",
		bg_black: "\x1b[40m",
		bg_red: "\x1b[41m",
		bg_green: "\x1b[42m",
		bg_yellow: "\x1b[43m",
		bg_blue: "\x1b[44m",
		bg_magenta: "\x1b[45m",
		bg_cyan: "\x1b[46m",
		bg_white: "\x1b[47m",
	};
	
	////////////////////////////////////////////////////////////////////////////////////
	// Default Attributes
	
	var defaultAttrs = {
		digraph: {						// https://graphviz.org/doc/info/attrs.html
			fontcolor: "#2D3436",
			fontname: "Sans-Serif",
			fontsize: "15",
			nodesep: "0.60",
			pad: "0.5",					// Padding when fiting
			ranksep: "0.75",
			splines: "ortho",			// none(""), line(false), polyline, curved, ortho, spline(true)
			//labelloc: "b",			// t(top), b(bottom, default), c(center)
			
			rankdir: "LR",				// TB(default), LR, BT, RL
			compound: true,				// If true, allow edges between clusters.
			//nodesep: 0.25,			// minimum space between two adjacent nodes in the same rank
			//ranksep: 0.5,				// minimum vertical distance between rank
		},
		node: {							// https://graphviz.org/doc/info/attrs.html
			shape: "none",
			style: "rounded",			// dashed, dotted, solid, invis, bold, filled, striped, wedged, diagonals, rounded (together possible: dashed,filled)
			fixedsize: true,
			width: "1.4",
			height: "1.9",
			labelloc: "b",				// t(top), b(bottom), c(center, default)
			
			// imagepos attribute is not backward compatible
			// TODO: check graphviz version to see if "imagepos" is available >= 2.40
			// https://github.com/xflr6/graphviz/blob/master/graphviz/backend.py#L248
			//imagepos: "mc",
			imagescale: true,
			fontname: "Sans-Serif",
			fontsize: "13",
			fontcolor: "#2D3436",
			target: "_blank",
		},
		edge: {							// https://graphviz.org/doc/info/attrs.html
			fontname: "Sans-Serif",
			fontsize: "13",
			fontcolor: "#2D3436",
			color: "#7B8894",
			style: "", 					// dashed, dotted, solid, invis, bold, tapered (together possible: dashed,bold)
		},
		subgraph: {						// https://graphviz.org/doc/info/attrs.html
			//shape: "box",
			style: "rounded",			// dashed, dotted, solid, invis, bold, filled, striped, rounded
			labeljust: "l",				// l(left), r(right), c(center)
			pencolor: "#AEB6BE",		// border color used to draw the bounding box around a cluster.
			fontname: "Sans-Serif",
			fontsize: "12",
			labelloc: "t",				// t(top, default), b(bottom), c(center)
			
			bgcolor: null,
			rankdir: "LR",
			peripheries: 1,				// border
		},
		subgraphBgcolors: [
			"#E5F5FD", "#EBF3E7", "#ECE8F6", "#FDF7E3", "#FDEAE3", "#E1FCFA", "#FCE1F9"
		],
		table: {						// https://graphviz.org/doc/info/shapes.html#html
			border : 0,					// Node attribute is lowercase, table attribute is uppercase
			cellborder: 1,
			cellspacing: 0,
			bgcolor: "white",
		},
		td: {							// https://graphviz.org/doc/info/shapes.html#html
			bgcolor: "white",
			width: "50px",				// mininum width
		},
		record: {
			shape: "record",			// record, Mrecord
			fixedsize: false,
			height: "0",
			style: "wedged",			// dashed, dotted, solid, invis, bold, filled, striped, wedged, diagonals, rounded (together possible: dashed,filled)
		},
		graphviz: {						// https://github.com/magjac/d3-graphviz#supported-options
			width: "100%", 
			height: "100%", 
			fit: true, 
			engine: "dot",				// circo, dot (default), fdp, neato, osage, patchwork, twopi
			zoom: true,					// drag & zoom enable/disable
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
		highlight: {
			enable: true,
			color: "black",
			shadow: true,
		},
		fullscreen: {
			enable: true,
			event: "click",
			css: {
				".sysdiagram_mask": {
					"position": "fixed",
					"height": "100%",
					"z-index": "900",
					"background-color": "#555",
					"opacity": "0.9",
					"left": "0px",
					"top": "0px",
					"width": "0%",
				},
				".sysdiagram_mask.show": {
					"width": "100%"
				},
				".sysdiagram[data-sysdiagram-processed=true].fullscreen": {
					"z-index": "999",
					"position": "fixed",
					"margin": "auto",
					"width": "calc(100% - 80px)",
					"height": "calc(100% - 80px)",
					"left": "0",
					"right": "0",
					"top": "0",
					"bottom": "0",
					"cursor": "pointer",
					"border": "2px solid #ccc",
					"box-shadow": "0 2px 8px 0 rgb(0 0 0 / 16%)",
					"min-width": "calc(100% - 80px) !important",
					"min-height": "calc(100% - 80px) !important",
					"background-color": "white",
					"border-radius": "4px",
				},
				".sysdiagram[data-sysdiagram-processed=true].fullscreen svg": {
					"max-width": "100% !important",
					"max-height": "100% !important",
					"height": "auto",
					"position": "absolute",
					"left": "50%",
					"top": "50%",
					"transform": "translate(-50%, -50%)",
					"background-color": "#fff",
					"border-radius": "4px",
				},
			}
		},
		selector: ".sysdiagram",
		startOnLoad: true,
		verbose: false,					// log output to console
		width: null,					// When you set the width, content's width is set after rendering.
		height: null,					// When you set the height, content's height is set after rendering.
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
			if (currentNode.type == "cluster") {
				node.cluster_uuid = currentNode.uuid;	// If it is included in the cluster
			}
			currentNode[node.uuid] = node;
			allNodes[node.uuid] = node;
		}
	}
	
	var directs = {'none': '-','forward': '->','back': '<-','both': '<->'};
	
	function addEdge(startNode, endNode, direct, attrs) {	//	direct: none, forward, back, both
		attrs = attrs || {};
		attrs.dir = direct;
		
		var startAttrs = startNode.attrs();
		var endAttrs = endNode.attrs();
		if (startAttrs.tooltip && endAttrs.tooltip && direct && !attrs.edgetooltip) {
			attrs.edgetooltip = `${startAttrs.tooltip} ${directs[direct]} ${endAttrs.tooltip}`; 
		}
		
		// for highlight
		startNode.connectedNodes[endNode.uuid] = (direct == "forward" ? "-" : (direct == "back" ? "<" : (direct == "both" ? "<" : "-")));
		endNode.connectedNodes[startNode.uuid] = (direct == "forward" ? "<" : (direct == "back" ? "-" : (direct == "both" ? "<" : "-")));
		
		var key = `${startNode.uuid} -> ${endNode.uuid}`;
		if (attrs.sport != null || attrs.eport != null) {
			var sport = attrs.sport != null ? ":" + attrs.sport : "";
			var eport = attrs.eport != null ? ":" + attrs.eport : "";
			delete attrs.sport;
			delete attrs.eport;
			key = `${startNode.uuid + sport} -> ${endNode.uuid + eport}`;
		}
		
		if (allEdges[key] == null) {
			allEdges[key] = {
				key: key,
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
		currentNode[cluster.uuid] = cluster;
		currentNode = cluster;
		nodeQueue.push(currentNode);
		allClusters[cluster.uuid] = cluster;
	}
	
	function cluster_exit(cluster) {
		nodeQueue.pop();
		currentNode = nodeQueue[nodeQueue.length - 1];
	}
	
	///////////////////////////////////////////////////////////////////////////////////
	// Diagram, Cluster, Node, Edge, ArrayNode
	
	function getArguments(args, baseAttrs) {
		var name = null;
		var callbackFunc = null;
		var attrs = null;
		for (var i = 0; i < args.length; i++) {
			var arg = args[i];
			if (typeof arg === "function") {
				callbackFunc = arg;
			} else if (typeof arg === "string") {
				name = arg;
			} else if (isObject(arg)) {
				attrs = arg;
			}
		}
		
		name = name == null ? "" : name;
		callbackFunc = callbackFunc || function() {};
		attrs = attrs || {};
		if (baseAttrs) {
			attrs = mergeAttrs(baseAttrs, attrs);
		}
		
		return {
			name: name,
			callbackFunc: callbackFunc,
			attrs: attrs
		};
	}
	
	function convEdge(edgeattrs, startNode, endNode) {
		// cluster connect, ltail (logical tail: start point)
		if (edgeattrs && edgeattrs.ltail && startNode) {
			if (startNode.cluster_uuid) {
				edgeattrs.ltail = startNode.cluster_uuid;
			} else {
				console.warn(`'${startNode.name}[${startNode.uuid}]' is not cluster member.`);
			}
		}
		// cluster connect, lhead (logical head: end point)
		if (edgeattrs && edgeattrs.lhead && endNode) {
			if (endNode.cluster_uuid) {
				edgeattrs.lhead = endNode.cluster_uuid;
			} else {
				console.warn(`'${endNode.name}[${endNode.uuid}]' is not cluster member.`);
			}
		}
		
		return edgeattrs;
	}
	
	function connect(me, node, direct) {
		if (!node) throw new Error('The node parameter for the connection is null.');
		
		if (Array.isArray(node)) {	// natvie array
			node = ArrayNode(node);
		}
		
		if (me.type == 'edge') {
			me = me.startNode;
		}
		
		if (Array.isArray(me)) {
			connectGroup(me, node, direct);
		} else if (me.type == 'array_node') {
			connectGroup(me.nodes, node, direct);
		} else {
			if (node.type == 'edge') {	// ignored direct
				var edge = node;
				me.edgeattrs = edge.attrs(me);
				edge.startNode = me;
			} else if (node.type == 'array_node') {
				var nodes = node.nodes;
				for (var i = 0; i < nodes.length; i++) {
					addNode(nodes[i]);
					addEdge(me, nodes[i], direct, convEdge(me.edgeattrs, me, nodes[i]));
				}
				me.edgeattrs = null;
			} else {
				addNode(node);
				addEdge(me, node, direct, convEdge(me.edgeattrs, me, node));
				me.edgeattrs = null;
			}
		}
		return node;
	}
	
	// nodes must be native array.
	function connectGroup(nodes, node, direct) {
		if (!node) throw new Error('The node parameter for the connection is null.');
		
		if (Array.isArray(node)) {	// natvie array
			node = ArrayNode(node);
		}
		
		if (node.type == 'edge') {	// ignored direct
			var edge = node;
			for (var i = 0; i < nodes.length; i++) {
				nodes[i].edgeattrs = edge.attrs(nodes[i]);
			}
			edge.startNode = nodes;
		} else if (node.type == 'array_node') {
			for (var i = 0; i < nodes.length; i++) {
				var tgts = node.nodes;
				for (var j = 0; j < tgts.length; j++) {
					addNode(tgts[j]);
					addEdge(nodes[i], tgts[j], direct, convEdge(nodes[i].edgeattrs, nodes[i], tgts[j]));
					nodes[i].edgeattrs = null;
				}
			}
		} else {
			addNode(node);
			for (var i = 0; i < nodes.length; i++) {
				addEdge(nodes[i], node, direct, convEdge(nodes[i].edgeattrs, nodes[i], node));
				nodes[i].edgeattrs = null;
			}
		}
		return node;
	}

	function Node(name, attrs, icon) {
		attrs = isObject(name) ? name : attrs;	// If the first argument is a attributes other than a name
		attrs = attrs || {};
		attrs = mergeAttrs(ctx.attributes.node, attrs);
		
		if (typeof name == "string") {
			attrs.label = name;
			if (!attrs.tooltip) {
				attrs.tooltip = name;
			}
		} else {
			name = "";
		}
		
		if (icon) {
			icons[icon] = true;
			attrs.image = icon;
		}
		
		var node = {
			type: 'node',
			uuid: uuid(),
			name: name,
			connectedNodes: {},
			link: function(node) {	// -
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
	
	
	function Edge(name, attrs) {
		var args = getArguments(arguments, ctx.attributes.edge);
		name = args.name;
		attrs = args.attrs;
		
		if (attrs.label) {
			attrs.edgetooltip = attrs.label;
		} else {
			attrs.label = name;
			if (!attrs.edgetooltip) {
				attrs.edgetooltip = name;
			}
		}
		
		var edge = {
			type: 'edge',
			uuid: uuid(),
			name: '_edge_',
			link: function(node) {	// -
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
		var args = getArguments(arguments, ctx.attributes.subgraph);
		name = args.name;
		attrs = args.attrs;
		callbackFunc = args.callbackFunc;
		
		attrs.label = name;
		if (!attrs.tooltip) {
			attrs.tooltip = name;
		}
		
		var cluster = {
			type: 'cluster',
			uuid: 'cluster_' + uuid(),
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
		var args = getArguments(arguments, ctx.attributes.digraph);
		name = args.name;
		attrs = args.attrs;
		callbackFunc = args.callbackFunc;
		
		attrs.label = name;
		if (!attrs.tooltip) {
			attrs.tooltip = name;
		}
		
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
		if (isObject(name)) {
			attrs = name;
			name = null;
		}
		if (isObject(icon)) {
			attrs = icon;
			icon = null;
		}
		return Node(name || "Custom", attrs, icon);
	};
	
	var Dummy = function(){
		var attrs = attrs || {};
		attrs.bgcolor = "#00000000";	// transparent or #00000000
		attrs.peripheries = 0;			// Border 0
		var node = Node("", attrs);
		node.dummy = true;
		return node;
	};
	
	var DummyCluster = function(callbackFunc, attrs) {
		var args = getArguments(arguments, ctx.attributes.digraph);
		attrs = args.attrs;
		callbackFunc = args.callbackFunc;
		
		attrs.bgcolor = "#00000000";	// transparent or #00000000
		attrs.peripheries = 0;			// Border 0
		var cluster = Cluster("", callbackFunc, attrs);
		cluster.dummy = true;
		return cluster;
	}
	
	function Table(attrs) {
		// Node attribute is lowercase, table attribute is uppercase
		attrs = attrs || {};
		attrs = mergeAttrs(ctx.attributes.table, attrs);
		
		var table = {
			type: 'table',
			tds: [],
			uuid: uuid(),
			name: '_table_',
			connectedNodes: {},
			link: function(node) {	// -
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
			td: function(name, attrs) {
				var td = Td(this, this.tds.length, name, attrs);
				this.tds.push(td);
				return table;
			},
			
			edgeattrs: null,
			attrs: function() {
				var label = [];
				label.push(`<<TABLE${toTableAttrs(attrs)}>`);
				for (var i in this.tds) {
					var td = this.tds[i];
					label.push(td.attrs().label);
				}
				label.push(`</TABLE>>`);
				attrs.label = label.join("");
				attrs.tooltip = this.tds.length > 0 ? stripHTML(this.tds[0].name) : "";
				// forced
				attrs.shape = "plain";
				attrs.fixedsize = false;
				return attrs;
			},
		};
		table._ = table.link;			// alias (-)
		table.$_ = table.outin;		// alias (<<) <-
		table._$ = table.inout;		// alias (>>) ->
		table.$_$ = table.both;		// alias (<< >>) <->
		table.left = table.outin;		// alias (<<)
		table.right = table.inout;	// alias (>>)
		table.e = table.edge;			// alias (edge)
		
		addNode(table);
		return table;
	}
	
	function Td(table, index, name, attrs) {
		attrs = isObject(name) ? name : attrs;	// If the first argument is a attributes other than a name
		attrs = attrs || {};
		attrs = mergeAttrs(ctx.attributes.td, attrs);
		
		if (typeof name != "string") {
			name = "";
		}
		
		var td = {
			type: 'td',
			name: name,
			
			attrs: function() {
				attrs.label = `<TR><TD PORT="${index}"${toTdAttrs(attrs)}>${this.name}</TD></TR>`;
				return attrs;
			},
		};
		
		return td;
	}
	
	function Record(attrs) {
		attrs = attrs || {};
		attrs = mergeAttrs(ctx.attributes.record, attrs);
		
		var record = {
			type: 'record',
			rows: [],
			uuid: uuid(),
			connectedNodes: {},
			link: function(node) {	// -
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
			row: function(name) {
				this.rows.push(name);
				return record;
			},
			
			edgeattrs: null,
			attrs: function() {
				var label = [];
				for (var i in this.rows) {
					var name = this.rows[i];
					label.push("<"+this.rows.length+">" + name);	// { ... }
				}
				attrs.label = label.join("|");
				attrs.tooltip = this.rows.length > 0 ? stripHTML(this.rows[0]) : "";
				return attrs;
			},
		};
		record._ = record.link;			// alias (-)
		record.$_ = record.outin;		// alias (<<) <-
		record._$ = record.inout;		// alias (>>) ->
		record.$_$ = record.both;		// alias (<< >>) <->
		record.left = record.outin;		// alias (<<)
		record.right = record.inout;	// alias (>>)
		record.e = record.edge;			// alias (edge)
		
		addNode(record);
		return record;
	} 

	///////////////////////////////////////////////////////////////////////////////////
	// Public function
	
	var isLoadedResources = false;
	
	function generate(scriptOrFunction) {
		loadResources();
		
		var script = scriptOrFunction;
		if (typeof scriptOrFunction == "function") {
			script = "(" + scriptOrFunction.toString() + ")()";
		}
		
		if (!script || script.trim().length == 0) {
			console.warn("Script for rendering is null or empty.");
			return "";
		}
		
		reset();
		
		if (ctx.attributes.fullscreen.enable) {
			initFullscreen();
		}
		
		try {
			ctx.eval(script);
		} catch(e) {
			printError(e, script);
			if (ctx.onErrorOccurred) {
				ctx.onErrorOccurred(e);
			} else {
				throw e;
			}
		}
		
		var dot = generateDot();
		log(`${ansi.blue}Generated DOT language: ${ansi.red}${dot}`);
		return dot;
	}
	
	function generateDot() {
		var lines = [];
		lines.push(`digraph "${rootNode.name}" {`);
		lines.push(`	graph ${toAttrs(rootNode.attrs())}`);
		lines.push(`	node ${toAttrs(ctx.attributes.node)}`);
		lines.push(`	edge ${toAttrs(ctx.attributes.edge)}`);
		lines.push(``);
		
		generateDotNode(lines, rootNode, 1, 1);
		
		lines.push(``);
		
		generateDotEdge(lines, allEdges);
		
		lines.push(`}`);
		return lines.join('\r\n');
	}
	
	function generateDotNode(lines, parent, depth, clusterDepth) {
		var tab = tabs(depth);
		for (var key in parent){
			var node = parent[key];
			if (node && node.type) {
				if (node.type == 'cluster') {
					lines.push(`${tab}subgraph ${node.uuid} {`);
					var attrs = node.attrs();
					if (!attrs.bgcolor) {	// Dummy is already set to the transparent background color.
						attrs.bgcolor = ctx.attributes.subgraphBgcolors[clusterDepth - 1];
					}
					lines.push(`${tabs(depth + 1)}graph ${toAttrs(attrs, ctx.attributes.digraph)}`);
					generateDotNode(lines, node, depth + 1, (node.dummy) ? clusterDepth : clusterDepth + 1);
					lines.push(`${tab}}`);
				} else if (node.type == 'node') {	// ignored array_node
					lines.push(`${tab}${key} ${toAttrs(node.attrs(), ctx.attributes.node)}`);
				} else if (node.type == 'table') {
					lines.push(`${tab}${key} ${toAttrs(node.attrs(), ctx.attributes.node)}`);
				} else if (node.type == 'record') {
					lines.push(`${tab}${key} ${toAttrs(node.attrs(), ctx.attributes.node)}`);
				}
			}
		}
	}
	
	function generateDotEdge(lines, edges) {
		for (var key in edges){
			var edge = edges[key];
			var attrs = edge.attrs();
			lines.push(`	${edge.key} ${toAttrs(attrs, ctx.attributes.edge)}`);
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
			var obj = getArguments(arguments);
			var args = [];
			args[0] = obj.name || key;
			args[1] = obj.attrs;
			args[2] = image;
			var node = Node.apply(null, args);
			return node;
		};
		namespace[key].imageURL = image;
	}
	
	function render(selectorOrElement, scriptOrFunction, graphvizOptions, callbackFunction) {
		var dot = generate(scriptOrFunction);
		if (dot) {
			var graphviz = createGraphviz(selectorOrElement, graphvizOptions);
			return renderDot(selectorOrElement, graphviz, dot, callbackFunction);
		}
		return null;
	}
	
	function createGraphviz(selectorOrElement, graphvizOptions) {
		graphvizOptions = graphvizOptions || {};
		graphvizOptions = mergeAttrs(ctx.attributes.graphviz, graphvizOptions);
		
		log("Graphviz options: ", graphvizOptions);
		
		if (graphvizOptions.scale) {
			if (!graphvizOptions.width || !graphvizOptions.height || String(graphvizOptions.width).indexOf("%") != -1  || String(graphvizOptions.height).indexOf("%") != -1) {
				console.warn("To use scale in graphviz, width and height must be set but not %. [ex: {... scale: 0.5, width: 700, height: 400 ...} ]");
			}
		}
		
		var element = ("string" == typeof selectorOrElement) ? document.querySelector(selectorOrElement) : selectorOrElement;
		if (!selectorOrElement) {
			throw new Error("The selector or element is null or emtpy.");
		}
		
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
			if (ctx.attributes.width) {
				element.style.width = ctx.attributes.width;
			}
			if (ctx.attributes.height) {
				element.style.height = ctx.attributes.height;
			}
			
			if (graphviz.sysdiagram_ctx.onCompleted) {
				graphviz.sysdiagram_ctx.onCompleted(element, this);
			}
			
			if (ctx.attributes.highlight.enable) {
				var func = highlight(ctx.attributes.highlight);
				func(element, graphviz);
			}
			
			if (ctx.attributes.fullscreen.enable) {
				var func = fullscreen(ctx.attributes.fullscreen);
				func(element, graphviz);
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
			var code = getTextCode(diagram);
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
	
	var countImage = 0;
	
	async function toImage(target, name, options) {
		if (!canvg) {
			throw new Error('Require canvg.js.\nNeed to add <script type="text/javascript" src="https://unpkg.com/canvg@3.0.7/lib/umd.js"></script>');
		}
		name = name || "sysdiagram-" + (++countImage);
			
		options = options || {}
		options.format = options.format || ctx.attributes.toImage.format;
		options.scale = options.scale ||  ctx.attributes.toImage.scale;
		options.quality = options.quality ||  ctx.attributes.toImage.quality;
		options.download = (options.download == null) ? true : options.download;
		options.delay = options.delay ||  ctx.attributes.toImage.delay;
		
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
	  return 'nxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
	
	function isHTML(str) {
		if (str) {
			// if HTML Tag contain, ex: label=< <b>..</b> >
			return str.match("^<( |\n|\r|\t)*<") != null && str.match(">( |\n|\r|\t)*>$") != null;
		}
		return false;
	}
	
	function stripHTML(str) {
		return str.replace(/<[^>]*>?/gm, '');
	}
	
	function isUpper(str) {
		return !/[a-z]/.test(str) && /[A-Z]/.test(str);
	}
	
	function toAttrs(attrs, baseAttrs) {
		var values = [];
		
		var keys = Object.keys(attrs);
		for (var i in keys) {
			var k = keys[i];
			if (attrs[k] == null) continue;
			if (baseAttrs && baseAttrs[k] == attrs[k]) continue;
			
			if (k == "label") {
				if (isHTML(attrs[k])) {
					values.push(`label=${attrs[k]}`);
				} else {
					values.push(`${k}="${attrs[k]}"`); 
				}
			} else if (k == "tooltip") {
				if (isHTML(attrs[k])) {
					values.push(`${k}="-"`); 
					continue;
				}
				values.push(`${k}="${attrs[k]}"`); 
			} else if (k == "edgetooltip") {
				var tmp = attrs[k].split(" -> ");
				if (tmp && tmp.length == 2) {
					var left = tmp[0]; 
					var right = tmp[1];
					if (isHTML(left) || isHTML(right)) {
						values.push(`${k}="-"`); 
						continue;
					}
				}
				values.push(`${k}="${attrs[k]}"`); 
			} else if (k == "imagescale") {
				values.push(`${k}=${attrs[k]}`);
			} else {
				values.push(`${k}="${attrs[k]}"`); 
			}
		}
		return '[' + values.join(", ") + ']';
	}
	
	var tableAttrs = [];
	("ALIGN,BGCOLOR,BORDER,CELLBORDER,CELLPADDING,CELLSPACING,COLOR,COLUMNS,FIXEDSIZE,GRADIENTANGLE,HEIGHT,HREF,ID,PORT,"
	+"ROWS,SIDES,STYLE,TARGET,TITLE,TOOLTIP,VALIGN,WIDTH").split(",").forEach(function(val) {tableAttrs[val] = 1});
	
	function toTableAttrs(obj) {
		var values = [];
		
		var keys = Object.keys(obj);
		for (var i in keys) {
			var k = keys[i];
			if (!tableAttrs[k.toUpperCase()]) continue;
			if (obj[k] == null) continue;
			if (k == "label") continue;
			
			values.push(`${k}="${obj[k]}"`);
		}
		return values.length > 0 ? " " + values.join(" ") : "";
	}
	
	var tdAttrs = [];
	("ALIGN,BALIGN,BGCOLOR,BORDER,CELLPADDING,CELLSPACING,COLOR,COLSPAN,FIXEDSIZE,GRADIENTANGLE,HEIGHT,HREF,ID,PORT,ROWSPAN,"
	+"SIDES,STYLE,TARGET,TITLE,TOOLTIP,VALIGN,WIDTH").split(",").forEach(function(val) {tdAttrs[val] = 1});

	function toTdAttrs(obj) {
		var values = [];
		
		var keys = Object.keys(obj);
		for (var i in keys) {
			var k = keys[i];
			if (!tdAttrs[k.toUpperCase()]) continue;
			if (obj[k] == null) continue;
			if (k == "label") continue;
			
			values.push(`${k}="${obj[k]}"`);
		}
		return values.length > 0 ? " " + values.join(" ") : "";
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
		if (src) cloneObject(src, attrs);
		if (target) cloneObject(target, attrs);
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
	
	function log() {
		if (ctx.attributes.verbose) {
			console.log.apply(null, arguments);
		}
	}
	
	function printError(e, script) {
		if (e.stack) {
			var items = e.stack.split("\n");
			for (var i = 0; i < items.length; i++) { 
				var item = items[i];
				var match = item.match(/<anonymous>:([0-9]+):([0-9]+)/);
				if (match && match.length == 3) {
					var row = parseInt(match[1]);
					var col = parseInt(match[2]);
					var lines = script.split("\n");
					var line = lines[row - 1];
					console.log(
`${ansi.blue}Sysdiagram Script Error: ${ansi.red}${e.message}
${ansi.blue}[${row}:${col}] ${ansi.red}${line}
${" ".repeat(4 + match[1].length + match[2].length) + toSpace(line, col - 1)}^^^`);
					
					e.detail = 
`[${row}:${col}] ${line}
${" ".repeat(4 + match[1].length + match[2].length) + toSpace(line, col - 1)}^^^`;
					break;
				}
			}
		}
		
		function toSpace(line, limit) {
			var spaces = "";
			for (var i = 0; i < limit; i++) {
				spaces += line[i] == "\t" ? "    " : " ";
			}
			return spaces;
		}
	}
	
	function getTextCode(element) {
		// If it is difficult to put it in a <div> like a table tag label, use <!-- --> to get the code if you put the code.
		var code = element.textContent;
		if (code.trim() == "") {
			var node = element.firstChild;
			while (node != null) {
				if (node.nodeType == 8) {	// COMMENT_NODE
					code = node.nodeValue;
					break;
				}
				node = node.nextSibling;
			}
		}
		return code;
	}
	
	function existsSelector(selector) { 
		for(var i = 0; i < document.styleSheets.length; i++) {
			if (!document.styleSheets[i].href) {
				var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
				for(var x in rules) {
					var txt = rules[x].selectorText;
					if (typeof txt == 'string') {
						if (txt == selector) {
							return true;
						}
					}
				}
			}
		}
		return false;
	}
	
	function addCSSRule(rule) {
		var style = document.createElement('style');
		document.head.appendChild(style);
		style.type = 'text/css';
		style.sheet.insertRule(rule);
	}
	
	///////////////////////////////////////////////////////////////////////////
	// Return
	
	var sysdiagram = {
		initialize: initialize,
		init: init,
		loadResources: loadResources,
		attributes: defaultAttrs,
		generate: generate,
		render: render,
		toImage: toImage,
		util: {
			getTextCode: getTextCode
		}
	};

	return sysdiagram;
	
	///////////////////////////////////////////////////////////////////////////
	// Embedded Helper
	function highlight(config) {
		return function(element, graphviz) {
			var elt = d3.select(element);
			var nodes = elt.selectAll(".node");
			var edges = elt.selectAll(".edge");
			var clusters = elt.selectAll(".cluster");
			
			nodes.on("mouseover", mouseOver(0.2))
				.on("mouseout", mouseOut);
			
			function isConnected(a, b) {
				return a.sysdiagram_data.connectedNodes[b.key] != null || a.key == b.key;
			}
			
			function setShadow(el) {
				if (config.shadow == true)
					el.style.filter = "drop-shadow(rgba(0, 0, 0, 0.7) 3px 3px 2px)";
			}
			
			function resetShadow(el) {
				if (config.shadow == true)
					el.style.filter = null;
			}

			function mouseOver(opacity) {
				return function(event, d) {
					nodes.select(function(o) {
						var value = isConnected(d, o) ? 1 : opacity;
						if (value == 1) {
							setShadow(this);
						}
						this.style.strokeOpacity = value;
						this.style.fillOpacity = value;
					});
					
					edges.select(function(o) {
						if (this.initHighlight == null) {
							this.path = this.querySelector("path");			// line
							if (this.path) {
								this.path_stroke = this.path.getAttribute("stroke");
							}
							
							this.polygon1 = this.querySelector("polygon:nth-of-type(1)");	// arrow
							if (this.polygon1) {
								this.polygon1_stroke = this.polygon1.getAttribute("stroke");
								this.polygon1_fill = this.polygon1.getAttribute("fill");
							}
							
							this.polygon2 = this.querySelector("polygon:nth-of-type(2)");	// arrow
							if (this.polygon2) {
								this.polygon2_stroke = this.polygon2.getAttribute("stroke");
								this.polygon2_fill = this.polygon2.getAttribute("fill");
							}
							this.initHighlight = true;
						}
						
						var value = o.key.indexOf(d.key) >= 0 ? 1 : opacity;
						
						if (value == 1) {
							if (this.path) {
								this.path.style.stroke = config.color;
								setShadow(this.path);
							}
							if (this.polygon1) {
								this.polygon1.style.stroke = config.color;
								this.polygon1.style.fill = config.color;
								setShadow(this.polygon1);
							}
							if (this.polygon2) {
								this.polygon2.style.stroke = config.color;
								this.polygon2.style.fill = config.color;
								setShadow(this.polygon2);
							}
						}
						
						this.style.strokeOpacity = value;
						this.style.fillOpacity = value;
					});
					
				};
			}

			function mouseOut(event, d) {
				nodes.select(function(o) {
					resetShadow(this);
					this.style.strokeOpacity = 1;	// nodes.style("stroke-opacity", 1);
					this.style.fillOpacity = 1;		// nodes.style("fill-opacity", 1);
				});
				
				edges.select(function(o) {
					if (this.path) {
						this.path.style.stroke = this.path_stroke;
						resetShadow(this.path);
					}
					if (this.polygon1) {
						this.polygon1.style.stroke = this.polygon1_stroke;
						this.polygon1.style.fill = this.polygon1_fill;
						resetShadow(this.polygon1);
					}
					if (this.polygon2) {
						this.polygon2.style.stroke = this.polygon2_stroke;
						this.polygon2.style.fill = this.polygon2_fill;
						resetShadow(this.polygon2);
					}
					this.style.strokeOpacity = 1;
					this.style.fillOpacity = 1;
				});
			}
		};
	}
	
	
	var isInitFullScreen = false;
	
	function initFullscreen() {
		if (!isInitFullScreen) {
			for (var selector in ctx.attributes.fullscreen.css) {
				var isRule = existsSelector(selector);
				if (!isRule) {
					var cssRule = ctx.attributes.fullscreen.css[selector];
					var txt = [];
					txt.push(selector + " {"); 
					for (var k in cssRule) {
						txt.push(`${k}: ${cssRule[k]};`);
					}
					txt.push("}"); 
					addCSSRule(txt.join(" "));
				}
			}
			// create mask
			var mask = document.createElement("div");
			mask.className = "sysdiagram_mask";
			document.body.appendChild(mask);
		}
		isInitFullScreen = true;
	}
	
	function fullscreen(config) {
		return function(element, graphviz) {
			element.addEventListener(config.event, function(e) {
				this.classList.toggle("fullscreen");
				document.querySelector(".sysdiagram_mask").classList.toggle("show");
			});
		};
	}
	
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
					Gitea: "gitea.png",
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
			},
			"ibm": {
				"analytics": {
					Analytics: "analytics.png",
					DataIntegration: "data-integration.png",
					DataRepositories: "data-repositories.png",
					DeviceAnalytics: "device-analytics.png",
					StreamingComputing: "streaming-computing.png",
				},
				"applications": {
					ActionableInsight: "actionable-insight.png",
					Annotate: "annotate.png",
					ApiDeveloperPortal: "api-developer-portal.png",
					ApiPolyglotRuntimes: "api-polyglot-runtimes.png",
					AppServer: "app-server.png",
					ApplicationLogic: "application-logic.png",
					EnterpriseApplications: "enterprise-applications.png",
					Index: "index.png",
					IotApplication: "iot-application.png",
					Microservice: "microservice.png",
					MobileApp: "mobile-app.png",
					Ontology: "ontology.png",
					OpenSourceTools: "open-source-tools.png",
					RuntimeServices: "runtime-services.png",
					SaasApplications: "saas-applications.png",
					ServiceBroker: "service-broker.png",
					SpeechToText: "speech-to-text.png",
					VisualRecognition: "visual-recognition.png",
					Visualization: "visualization.png",
				},
				"blockchain": {
					BlockchainDeveloper: "blockchain-developer.png",
					Blockchain: "blockchain.png",
					CertificateAuthority: "certificate-authority.png",
					ClientApplication: "client-application.png",
					Communication: "communication.png",
					Consensus: "consensus.png",
					EventListener: "event-listener.png",
					Event: "event.png",
					ExistingEnterpriseSystems: "existing-enterprise-systems.png",
					HyperledgerFabric: "hyperledger-fabric.png",
					KeyManagement: "key-management.png",
					Ledger: "ledger.png",
					MembershipServicesProviderApi: "membership-services-provider-api.png",
					Membership: "membership.png",
					MessageBus: "message-bus.png",
					Node: "node.png",
					Services: "services.png",
					SmartContract: "smart-contract.png",
					TransactionManager: "transaction-manager.png",
					Wallet: "wallet.png",
				},
				"compute": {
					BareMetalServer: "bare-metal-server.png",
					ImageService: "image-service.png",
					Instance: "Instance.png",
					Key: "Key.png",
					PowerInstance: "power-instance.png",
				},
				"data": {
					Caches: "caches.png",
					Cloud: "cloud.png",
					ConversationTrainedDeployed: "conversation-trained-deployed.png",
					DataServices: "data-services.png",
					DataSources: "data-sources.png",
					DeviceIdentityService: "device-identity-service.png",
					DeviceRegistry: "device-registry.png",
					EnterpriseData: "enterprise-data.png",
					EnterpriseUserDirectory: "enterprise-user-directory.png",
					FileRepository: "file-repository.png",
					GroundTruth: "ground-truth.png",
					Model: "model.png",
					TmsDataInterface: "tms-data-interface.png",
				},
				"devops": {
					ArtifactManagement: "artifact-management.png",
					BuildTest: "build-test.png",
					CodeEditor: "code-editor.png",
					CollaborativeDevelopment: "collaborative-development.png",
					ConfigurationManagement: "configuration-management.png",
					ContinuousDeploy: "continuous-deploy.png",
					ContinuousTesting: "continuous-testing.png",
					Devops: "devops.png",
					Provision: "provision.png",
					ReleaseManagement: "release-management.png",
				},
				"general": {
					CloudMessaging: "cloud-messaging.png",
					CloudServices: "cloud-services.png",
					Cloudant: "cloudant.png",
					CognitiveServices: "cognitive-services.png",
					DataSecurity: "data-security.png",
					Enterprise: "Enterprise.png",
					GovernanceRiskCompliance: "governance-risk-compliance.png",
					IBMContainers: "ibm-containers.png",
					IBMPublicCloud: "ibm-public-cloud.png",
					IdentityAccessManagement: "identity-access-management.png",
					IdentityProvider: "identity-provider.png",
					InfrastructureSecurity: "infrastructure-security.png",
					Internet: "Internet.png",
					IotCloud: "iot-cloud.png",
					MicroservicesApplication: "microservices-application.png",
					MicroservicesMesh: "microservices-mesh.png",
					MonitoringLogging: "monitoring-logging.png",
					Monitoring: "monitoring.png",
					ObjectStorage: "object-storage.png",
					OfflineCapabilities: "offline-capabilities.png",
					Openwhisk: "openwhisk.png",
					PeerCloud: "peer-cloud.png",
					RetrieveRank: "retrieve-rank.png",
					Scalable: "scalable.png",
					ServiceDiscoveryConfiguration: "service-discovery-configuration.png",
					TextToSpeech: "text-to-speech.png",
					TransformationConnectivity: "transformation-connectivity.png",
				},
				"infrastructure": {
					Channels: "channels.png",
					CloudMessaging: "cloud-messaging.png",
					Dashboard: "dashboard.png",
					Diagnostics: "diagnostics.png",
					EdgeServices: "edge-services.png",
					EnterpriseMessaging: "enterprise-messaging.png",
					EventFeed: "event-feed.png",
					InfrastructureServices: "infrastructure-services.png",
					InterserviceCommunication: "interservice-communication.png",
					LoadBalancingRouting: "load-balancing-routing.png",
					MicroservicesMesh: "microservices-mesh.png",
					MobileBackend: "mobile-backend.png",
					MobileProviderNetwork: "mobile-provider-network.png",
					MonitoringLogging: "monitoring-logging.png",
					Monitoring: "monitoring.png",
					PeerServices: "peer-services.png",
					ServiceDiscoveryConfiguration: "service-discovery-configuration.png",
					TransformationConnectivity: "transformation-connectivity.png",
				},
				"management": {
					AlertNotification: "alert-notification.png",
					ApiManagement: "api-management.png",
					CloudManagement: "cloud-management.png",
					ClusterManagement: "cluster-management.png",
					ContentManagement: "content-management.png",
					DataServices: "data-services.png",
					DeviceManagement: "device-management.png",
					InformationGovernance: "information-governance.png",
					ItServiceManagement: "it-service-management.png",
					Management: "management.png",
					MonitoringMetrics: "monitoring-metrics.png",
					ProcessManagement: "process-management.png",
					ProviderCloudPortalService: "provider-cloud-portal-service.png",
					PushNotifications: "push-notifications.png",
					ServiceManagementTools: "service-management-tools.png",
				},
				"network": {
					Bridge: "Bridge.png",
					DirectLink: "direct-link.png",
					Enterprise: "Enterprise.png",
					Firewall: "Firewall.png",
					FloatingIp: "floating-ip.png",
					Gateway: "Gateway.png",
					InternetServices: "internet-services.png",
					LoadBalancerListener: "load-balancer-listener.png",
					LoadBalancerPool: "load-balancer-pool.png",
					LoadBalancer: "load-balancer.png",
					LoadBalancingRouting: "load-balancing-routing.png",
					PublicGateway: "public-gateway.png",
					Region: "Region.png",
					Router: "Router.png",
					Rules: "Rules.png",
					Subnet: "Subnet.png",
					TransitGateway: "transit-gateway.png",
					Vpc: "VPC.png",
					VpnConnection: "vpn-connection.png",
					VpnGateway: "vpn-gateway.png",
					VpnPolicy: "vpn-policy.png",
				},
				"security": {
					ApiSecurity: "api-security.png",
					BlockchainSecurityService: "blockchain-security-service.png",
					DataSecurity: "data-security.png",
					Firewall: "firewall.png",
					Gateway: "gateway.png",
					GovernanceRiskCompliance: "governance-risk-compliance.png",
					IdentityAccessManagement: "identity-access-management.png",
					IdentityProvider: "identity-provider.png",
					InfrastructureSecurity: "infrastructure-security.png",
					PhysicalSecurity: "physical-security.png",
					SecurityMonitoringIntelligence: "security-monitoring-intelligence.png",
					SecurityServices: "security-services.png",
					TrustendComputing: "trustend-computing.png",
					Vpn: "vpn.png",
				},
				"social": {
					Communities: "communities.png",
					FileSync: "file-sync.png",
					LiveCollaboration: "live-collaboration.png",
					Messaging: "messaging.png",
					Networking: "networking.png",
				},
				"storage": {
					BlockStorage: "block-storage.png",
					ObjectStorage: "object-storage.png",
				},
				"user": {
					Browser: "browser.png",
					Device: "device.png",
					IntegratedDigitalExperiences: "integrated-digital-experiences.png",
					PhysicalEntity: "physical-entity.png",
					Sensor: "sensor.png",
					User: "user.png",
				},
			},
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
			},
			"ibm": {
				"network": {
					"ACL": "Rules",
					"CIS": "InternetServices",
					"DL": "DirectLink",
					"FIP": "FloatingIp",
					"FloatingIP": "FloatingIp",
					"FW": "Firewall",
					"LB": "LoadBalancer",
					"NLB": "LoadBalancer",
					"PublicGateway": "Gateway",
					"SecurityGroupRules": "Rules",
					"TG": "TransitGateway",
					"VPC": "Vpc",
					"VPNGateway": "VpnGateway",
					"VPNConnection": "VpnConnection",
					"VPNPolicy": "VpnPolicy",
				}
			},
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
					CocCoc: "https://cdn.jsdelivr.net/gh/alrra/browser-logos/src/c%E1%BB%91c-c%E1%BB%91c/c%E1%BB%91c-c%E1%BB%91c_256x256.png",
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
			},
			// https://github.com/edent/SuperTinyIcons
			supertinyicons: {
				socialmedia: {
					Flickr: "https://edent.github.io/SuperTinyIcons/images/svg/flickr.svg",
					Facebook: "https://edent.github.io/SuperTinyIcons/images/svg/facebook.svg",
					Tumblr: "https://edent.github.io/SuperTinyIcons/images/svg/tumblr.svg",
					Twitter: "https://edent.github.io/SuperTinyIcons/images/svg/twitter.svg",
					LinkedIn: "https://edent.github.io/SuperTinyIcons/images/svg/linkedin.svg",
					Instagram: "https://edent.github.io/SuperTinyIcons/images/svg/instagram.svg",
					Reddit: "https://edent.github.io/SuperTinyIcons/images/svg/reddit.svg",
					Pinterest: "https://edent.github.io/SuperTinyIcons/images/svg/pinterest.svg",
					VK: "https://edent.github.io/SuperTinyIcons/images/svg/vk.svg",
					Mastodon: "https://edent.github.io/SuperTinyIcons/images/svg/mastodon.svg",
					Imgur: "https://edent.github.io/SuperTinyIcons/images/svg/imgur.svg",
					Slack: "https://edent.github.io/SuperTinyIcons/images/svg/slack.svg",
					Devto: "https://edent.github.io/SuperTinyIcons/images/svg/dev_to.svg",
					Goodreads: "https://edent.github.io/SuperTinyIcons/images/svg/goodreads.svg",
					TikTok: "https://edent.github.io/SuperTinyIcons/images/svg/tiktok.svg",
					Friendica: "https://edent.github.io/SuperTinyIcons/images/svg/friendica.svg",
				},
				media: {
					SoundCloud: "https://edent.github.io/SuperTinyIcons/images/svg/soundcloud.svg",
					Vimeo: "https://edent.github.io/SuperTinyIcons/images/svg/vimeo.svg",
					Spotify: "https://edent.github.io/SuperTinyIcons/images/svg/spotify.svg",
					YouTube: "https://edent.github.io/SuperTinyIcons/images/svg/youtube.svg",
					AppleMusic: "https://edent.github.io/SuperTinyIcons/images/svg/apple_music.svg",
					Bandcamp: "https://edent.github.io/SuperTinyIcons/images/svg/bandcamp.svg",
					Deezer: "https://edent.github.io/SuperTinyIcons/images/svg/deezer.svg",
					IHeartRadio: "https://edent.github.io/SuperTinyIcons/images/svg/iheartradio.svg",
					Kodi: "https://edent.github.io/SuperTinyIcons/images/svg/kodi.svg",
					Foobar2000: "https://edent.github.io/SuperTinyIcons/images/svg/foobar2000.svg",
				},
				google: {
					Google: "https://edent.github.io/SuperTinyIcons/images/svg/google.svg",
					GooglePlay: "https://edent.github.io/SuperTinyIcons/images/svg/google_play.svg",
					Gmail: "https://edent.github.io/SuperTinyIcons/images/svg/gmail.svg",
					GoogleCalendar: "https://edent.github.io/SuperTinyIcons/images/svg/google_calendar.svg",
					GoogleCollaborativeContentTools: "https://edent.github.io/SuperTinyIcons/images/svg/google_collaborative_content_tools.svg",
					GoogleDocsEditors: "https://edent.github.io/SuperTinyIcons/images/svg/google_docs_editors.svg",
					GoogleDrive: "https://edent.github.io/SuperTinyIcons/images/svg/google_drive.svg",
					GoogleMeet: "https://edent.github.io/SuperTinyIcons/images/svg/google_meet.svg",
					GoogleMaps: "https://edent.github.io/SuperTinyIcons/images/svg/google_maps.svg",
					GoogleScholar: "https://edent.github.io/SuperTinyIcons/images/svg/google_scholar.svg",
					GoogleDrive: "https://edent.github.io/SuperTinyIcons/images/svg/google_drive.svg",
					GoogleMapsOld: "https://edent.github.io/SuperTinyIcons/images/svg/google_maps_old.svg",
					GoogleMailOld: "https://edent.github.io/SuperTinyIcons/images/svg/gmail_old.svg",
					GoogleDriveOld: "https://edent.github.io/SuperTinyIcons/images/svg/google_drive_old.svg",
					GooglePlus: "https://edent.github.io/SuperTinyIcons/images/svg/google_plus.svg",
				},
				communications: {
					WhatsApp: "https://edent.github.io/SuperTinyIcons/images/svg/whatsapp.svg",
					Telegram: "https://edent.github.io/SuperTinyIcons/images/svg/telegram.svg",
					Skype: "https://edent.github.io/SuperTinyIcons/images/svg/skype.svg",
					Snapchat: "https://edent.github.io/SuperTinyIcons/images/svg/snapchat.svg",
					WeChat: "https://edent.github.io/SuperTinyIcons/images/svg/wechat.svg",
					Signal: "https://edent.github.io/SuperTinyIcons/images/svg/signal.svg",
					Phone: "https://edent.github.io/SuperTinyIcons/images/svg/phone.svg",
					LINE: "https://edent.github.io/SuperTinyIcons/images/svg/line.svg",
					Viber: "https://edent.github.io/SuperTinyIcons/images/svg/viber.svg",
					Mailchimp: "https://edent.github.io/SuperTinyIcons/images/svg/mailchimp.svg",
					Threema: "https://edent.github.io/SuperTinyIcons/images/svg/threema.svg",
					Mattermost: "https://edent.github.io/SuperTinyIcons/images/svg/mattermost.svg",
					Protonmail: "https://edent.github.io/SuperTinyIcons/images/svg/protonmail.svg",
					XMPP: "https://edent.github.io/SuperTinyIcons/images/svg/xmpp.svg",
					Tutanota: "https://edent.github.io/SuperTinyIcons/images/svg/tutanota.svg",
					Messenger: "https://edent.github.io/SuperTinyIcons/images/svg/messenger.svg",
					Discord: "https://edent.github.io/SuperTinyIcons/images/svg/discord.svg",
					Zoom: "https://edent.github.io/SuperTinyIcons/images/svg/zoom.svg",
					Wire: "https://edent.github.io/SuperTinyIcons/images/svg/wire.svg",
					Teamspeak: "https://edent.github.io/SuperTinyIcons/images/svg/teamspeak.svg",
					Element: "https://edent.github.io/SuperTinyIcons/images/svg/element.svg",
				},
				websites: {
					HackerNews: "https://edent.github.io/SuperTinyIcons/images/svg/hackernews.svg",
					StackOverflow: "https://edent.github.io/SuperTinyIcons/images/svg/stackoverflow.svg",
					StackExchange: "https://edent.github.io/SuperTinyIcons/images/svg/stackexchange.svg",
					WordPress: "https://edent.github.io/SuperTinyIcons/images/svg/wordpress.svg",
					GitHub: "https://edent.github.io/SuperTinyIcons/images/svg/github.svg",
					Wikipedia: "https://edent.github.io/SuperTinyIcons/images/svg/wikipedia.svg",
					GitLab: "https://edent.github.io/SuperTinyIcons/images/svg/gitlab.svg",
					Meetup: "https://edent.github.io/SuperTinyIcons/images/svg/meetup.svg",
					EBay: "https://edent.github.io/SuperTinyIcons/images/svg/ebay.svg",
					Kickstarter: "https://edent.github.io/SuperTinyIcons/images/svg/kickstarter.svg",
					Yahoo: "https://edent.github.io/SuperTinyIcons/images/svg/yahoo.svg",
					Evernote: "https://edent.github.io/SuperTinyIcons/images/svg/evernote.svg",
					Yammer: "https://edent.github.io/SuperTinyIcons/images/svg/yammer.svg",
					Blogger: "https://edent.github.io/SuperTinyIcons/images/svg/blogger.svg",
					Cloudflare: "https://edent.github.io/SuperTinyIcons/images/svg/cloudflare.svg",
					Amazon: "https://edent.github.io/SuperTinyIcons/images/svg/amazon.svg",
					Strava: "https://edent.github.io/SuperTinyIcons/images/svg/strava.svg",
					Dribbble: "https://edent.github.io/SuperTinyIcons/images/svg/dribbble.svg",
					CodePen: "https://edent.github.io/SuperTinyIcons/images/svg/codepen.svg",
					DigitalOcean: "https://edent.github.io/SuperTinyIcons/images/svg/digitalocean.svg",
					Medium: "https://edent.github.io/SuperTinyIcons/images/svg/medium.svg",
					Airbnb: "https://edent.github.io/SuperTinyIcons/images/svg/airbnb.svg",
					Delicious: "https://edent.github.io/SuperTinyIcons/images/svg/delicious.svg",
					Disqus: "https://edent.github.io/SuperTinyIcons/images/svg/disqus.svg",
					Ghost: "https://edent.github.io/SuperTinyIcons/images/svg/ghost.svg",
					Sketch: "https://edent.github.io/SuperTinyIcons/images/svg/sketch.svg",
					Trello: "https://edent.github.io/SuperTinyIcons/images/svg/trello.svg",
					QQ: "https://edent.github.io/SuperTinyIcons/images/svg/qq.svg",
					Badoo: "https://edent.github.io/SuperTinyIcons/images/svg/badoo.svg",
					Yelp: "https://edent.github.io/SuperTinyIcons/images/svg/yelp.svg",
					Workato: "https://edent.github.io/SuperTinyIcons/images/svg/workato.svg",
					Untappd: "https://edent.github.io/SuperTinyIcons/images/svg/untappd.svg",
					Vivino: "https://edent.github.io/SuperTinyIcons/images/svg/vivino.svg",
					Apereo: "https://edent.github.io/SuperTinyIcons/images/svg/apereo.svg",
					Twilio: "https://edent.github.io/SuperTinyIcons/images/svg/twilio.svg",
					Plex: "https://edent.github.io/SuperTinyIcons/images/svg/plex.svg",
					XING: "https://edent.github.io/SuperTinyIcons/images/svg/xing.svg",
					Pinboard: "https://edent.github.io/SuperTinyIcons/images/svg/pinboard.svg",
					InternetArchive: "https://edent.github.io/SuperTinyIcons/images/svg/internet_archive.svg",
					Access: "https://edent.github.io/SuperTinyIcons/images/svg/access.svg",
					baidu: "https://edent.github.io/SuperTinyIcons/images/svg/baidu.svg",
					Twitch: "https://edent.github.io/SuperTinyIcons/images/svg/twitch.svg",
					OKru: "https://edent.github.io/SuperTinyIcons/images/svg/ok.svg",
					Pocket: "https://edent.github.io/SuperTinyIcons/images/svg/pocket.svg",
					StumbleUpon: "https://edent.github.io/SuperTinyIcons/images/svg/stumbleupon.svg",
					Opencast: "https://edent.github.io/SuperTinyIcons/images/svg/opencast.svg",
					Buffer: "https://edent.github.io/SuperTinyIcons/images/svg/buffer.svg",
					Upwork: "https://edent.github.io/SuperTinyIcons/images/svg/upwork.svg",
					DuckDuckGo: "https://edent.github.io/SuperTinyIcons/images/svg/duckduckgo.svg",
					Bing: "https://edent.github.io/SuperTinyIcons/images/svg/bing.svg",
					IMDb: "https://edent.github.io/SuperTinyIcons/images/svg/imdb.svg",
					Heroku: "https://edent.github.io/SuperTinyIcons/images/svg/heroku.svg",
					ResearchGate: "https://edent.github.io/SuperTinyIcons/images/svg/researchgate.svg",
					OpenCores: "https://edent.github.io/SuperTinyIcons/images/svg/opencores.svg",
					OpenBenches: "https://edent.github.io/SuperTinyIcons/images/svg/openbenches.svg",
					TripAdvisor: "https://edent.github.io/SuperTinyIcons/images/svg/tripadvisor.svg",
					Sentry: "https://edent.github.io/SuperTinyIcons/images/svg/sentry.svg",
					Behance: "https://edent.github.io/SuperTinyIcons/images/svg/behance.svg",
					Taigaio: "https://edent.github.io/SuperTinyIcons/images/svg/taiga.svg",
					Coilcom: "https://edent.github.io/SuperTinyIcons/images/svg/coil.svg",
					Glitch: "https://edent.github.io/SuperTinyIcons/images/svg/glitch.svg",
					AngelList: "https://edent.github.io/SuperTinyIcons/images/svg/angellist.svg",
					Jellyfin: "https://edent.github.io/SuperTinyIcons/images/svg/jellyfin.svg",
					Gandi: "https://edent.github.io/SuperTinyIcons/images/svg/gandi.svg",
					Kaggle: "https://edent.github.io/SuperTinyIcons/images/svg/kaggle.svg",
					Humblebundle: "https://edent.github.io/SuperTinyIcons/images/svg/humblebundle.svg",
					FfreeCodeCamp: "https://edent.github.io/SuperTinyIcons/images/svg/freecodecamp.svg",
					Codeberg: "https://edent.github.io/SuperTinyIcons/images/svg/codeberg.svg",
					BitBucket: "https://edent.github.io/SuperTinyIcons/images/svg/bitbucket.svg",
					Etsy: "https://edent.github.io/SuperTinyIcons/images/svg/etsy.svg",
					Intercom: "https://edent.github.io/SuperTinyIcons/images/svg/intercom.svg",
					Intercom: "https://edent.github.io/SuperTinyIcons/images/svg/overleaf.svg",
					Malt: "https://edent.github.io/SuperTinyIcons/images/svg/malt.svg",
				},
				internet: {
					RSS: "https://edent.github.io/SuperTinyIcons/images/svg/rss.svg",
					Mail: "https://edent.github.io/SuperTinyIcons/images/svg/mail.svg",
					Email: "https://edent.github.io/SuperTinyIcons/images/svg/email.svg",
					HTML5: "https://edent.github.io/SuperTinyIcons/images/svg/html5.svg",
					WiFi: "https://edent.github.io/SuperTinyIcons/images/svg/wifi.svg",
					W3C: "https://edent.github.io/SuperTinyIcons/images/svg/w3c.svg",
					TheUnicodeConsortium: "https://edent.github.io/SuperTinyIcons/images/svg/unicode.svg",
					Markdown: "https://edent.github.io/SuperTinyIcons/images/svg/markdown.svg",
					HAML: "https://edent.github.io/SuperTinyIcons/images/svg/haml.svg",
					Microformats: "https://edent.github.io/SuperTinyIcons/images/svg/microformats.svg",
					CSS3: "https://edent.github.io/SuperTinyIcons/images/svg/css3.svg",
				},
				browsers: {
					Chrome: "https://edent.github.io/SuperTinyIcons/images/svg/chrome.svg",
					Firefox: "https://edent.github.io/SuperTinyIcons/images/svg/firefox.svg",
					SamsungInternet: "https://edent.github.io/SuperTinyIcons/images/svg/samsung_internet.svg",
					Edge: "https://edent.github.io/SuperTinyIcons/images/svg/edge.svg",
					Opera: "https://edent.github.io/SuperTinyIcons/images/svg/opera.svg",
					Safari: "https://edent.github.io/SuperTinyIcons/images/svg/safari.svg",
					Chromium: "https://edent.github.io/SuperTinyIcons/images/svg/chromium.svg",
				},
				podcasts: {
					ITunes: "https://edent.github.io/SuperTinyIcons/images/svg/itunes_podcasts.svg",
					Google: "https://edent.github.io/SuperTinyIcons/images/svg/google_podcasts.svg",
					PocketCasts: "https://edent.github.io/SuperTinyIcons/images/svg/pocketcasts.svg",
					Stitcher: "https://edent.github.io/SuperTinyIcons/images/svg/stitcher.svg",
					TuneIn: "https://edent.github.io/SuperTinyIcons/images/svg/tunein.svg",
					Acast: "https://edent.github.io/SuperTinyIcons/images/svg/acast.svg",
					Overcast: "https://edent.github.io/SuperTinyIcons/images/svg/overcast.svg",
				},
				logos: {
					Apple: "https://edent.github.io/SuperTinyIcons/images/svg/apple.svg",
					NPM: "https://edent.github.io/SuperTinyIcons/images/svg/npm.svg",
					Docker: "https://edent.github.io/SuperTinyIcons/images/svg/docker.svg",
					IBM: "https://edent.github.io/SuperTinyIcons/images/svg/ibm.svg",
					OpenSource: "https://edent.github.io/SuperTinyIcons/images/svg/opensource.svg",
					Intel: "https://edent.github.io/SuperTinyIcons/images/svg/intel.svg",
					VLC: "https://edent.github.io/SuperTinyIcons/images/svg/vlc.svg",
					Vegetarian: "https://edent.github.io/SuperTinyIcons/images/svg/vegetarian.svg",
					Espressif: "https://edent.github.io/SuperTinyIcons/images/svg/espressif.svg",
					NHS: "https://edent.github.io/SuperTinyIcons/images/svg/nhs.svg",
					Orcid: "https://edent.github.io/SuperTinyIcons/images/svg/orcid.svg",
					HP: "https://edent.github.io/SuperTinyIcons/images/svg/hp.svg",
					RedHat: "https://edent.github.io/SuperTinyIcons/images/svg/redhat.svg",
					CentOS: "https://edent.github.io/SuperTinyIcons/images/svg/centos.svg",
					Git: "https://edent.github.io/SuperTinyIcons/images/svg/git.svg",
					Microsoft: "https://edent.github.io/SuperTinyIcons/images/svg/microsoft.svg",
					Grafana: "https://edent.github.io/SuperTinyIcons/images/svg/grafana.svg",
					Ubiquiti: "https://edent.github.io/SuperTinyIcons/images/svg/ubiquiti.svg",
					Adobe: "https://edent.github.io/SuperTinyIcons/images/svg/adobe.svg",
					Homekit: "https://edent.github.io/SuperTinyIcons/images/svg/homekit.svg",
					Pixelfed: "https://edent.github.io/SuperTinyIcons/images/svg/pixelfed.svg",
					Samsung: "https://edent.github.io/SuperTinyIcons/images/svg/samsung.svg",
					Samsung: "https://edent.github.io/SuperTinyIcons/images/svg/samsung_s.svg",
					Samsung: "https://edent.github.io/SuperTinyIcons/images/svg/samsung_swoop.svg",
					Uphold: "https://edent.github.io/SuperTinyIcons/images/svg/uphold.svg",
					CoinPot: "https://edent.github.io/SuperTinyIcons/images/svg/coinpot.svg",
					ThisAmericanLife: "https://edent.github.io/SuperTinyIcons/images/svg/thisamericanlife.svg",
					WHATWG: "https://edent.github.io/SuperTinyIcons/images/svg/whatwg.svg",
				},
				security: {
					Tox: "https://edent.github.io/SuperTinyIcons/images/svg/tox.svg",
					Lock: "https://edent.github.io/SuperTinyIcons/images/svg/lock.svg",
					LastPass: "https://edent.github.io/SuperTinyIcons/images/svg/lastpass.svg",
					Symantec: "https://edent.github.io/SuperTinyIcons/images/svg/symantec.svg",
					Yubico: "https://edent.github.io/SuperTinyIcons/images/svg/yubico.svg",
					Keybase: "https://edent.github.io/SuperTinyIcons/images/svg/keybase.svg",
					Authy: "https://edent.github.io/SuperTinyIcons/images/svg/authy.svg",
					HackerOne: "https://edent.github.io/SuperTinyIcons/images/svg/hackerone.svg",
					Bitwarden: "https://edent.github.io/SuperTinyIcons/images/svg/bitwarden.svg",
					Auth0: "https://edent.github.io/SuperTinyIcons/images/svg/auth0.svg",
					AndOTP: "https://edent.github.io/SuperTinyIcons/images/svg/andotp.svg",
					OpenBugBounty: "https://edent.github.io/SuperTinyIcons/images/svg/openbugbounty.svg",
					OpenVPN: "https://edent.github.io/SuperTinyIcons/images/svg/openvpn.svg",
					KeePassDX: "https://edent.github.io/SuperTinyIcons/images/svg/keepassdx.svg",
					WireGuard: "https://edent.github.io/SuperTinyIcons/images/svg/wireguard.svg",
				},
				payments: {
					PayPal: "https://edent.github.io/SuperTinyIcons/images/svg/paypal.svg",
					Bitcoin: "https://edent.github.io/SuperTinyIcons/images/svg/bitcoin.svg",
					Ethereum: "https://edent.github.io/SuperTinyIcons/images/svg/ethereum.svg",
					Liberapay: "https://edent.github.io/SuperTinyIcons/images/svg/liberapay.svg",
					KoFi: "https://edent.github.io/SuperTinyIcons/images/svg/ko-fi.svg",
					Flattr: "https://edent.github.io/SuperTinyIcons/images/svg/flattr.svg",
					Patreon: "https://edent.github.io/SuperTinyIcons/images/svg/patreon.svg",
					Venmo: "https://edent.github.io/SuperTinyIcons/images/svg/venmo.svg",
					SquareCashApp: "https://edent.github.io/SuperTinyIcons/images/svg/square_cash.svg",
					OpenCollective: "https://edent.github.io/SuperTinyIcons/images/svg/opencollective.svg",
					GateHub: "https://edent.github.io/SuperTinyIcons/images/svg/gatehub.svg",
				},
				programming: {
					Python: "https://edent.github.io/SuperTinyIcons/images/svg/python.svg",
					Julia: "https://edent.github.io/SuperTinyIcons/images/svg/julia.svg",
					PHP: "https://edent.github.io/SuperTinyIcons/images/svg/php.svg",
					Laravel: "https://edent.github.io/SuperTinyIcons/images/svg/laravel.svg",
					Drupal: "https://edent.github.io/SuperTinyIcons/images/svg/drupal.svg",
					React: "https://edent.github.io/SuperTinyIcons/images/svg/react.svg",
					Angular: "https://edent.github.io/SuperTinyIcons/images/svg/angular.svg",
					Sass: "https://edent.github.io/SuperTinyIcons/images/svg/sass.svg",
					JSON: "https://edent.github.io/SuperTinyIcons/images/svg/json.svg",
					Yarn: "https://edent.github.io/SuperTinyIcons/images/svg/yarn.svg",
					Go: "https://edent.github.io/SuperTinyIcons/images/svg/go.svg",
					Java: "https://edent.github.io/SuperTinyIcons/images/svg/java.svg",
					Rust: "https://edent.github.io/SuperTinyIcons/images/svg/rust.svg",
					Clojure: "https://edent.github.io/SuperTinyIcons/images/svg/clojure.svg",
					CoffeeScript: "https://edent.github.io/SuperTinyIcons/images/svg/coffeescript.svg",
					JavaScript: "https://edent.github.io/SuperTinyIcons/images/svg/javascript.svg",
					Flutter: "https://edent.github.io/SuperTinyIcons/images/svg/flutter.svg",
					Backbone: "https://edent.github.io/SuperTinyIcons/images/svg/backbone.svg",
					Vue: "https://edent.github.io/SuperTinyIcons/images/svg/vue.svg",
					Gradle: "https://edent.github.io/SuperTinyIcons/images/svg/gradle.svg",
					AmberFramework: "https://edent.github.io/SuperTinyIcons/images/svg/amberframework.svg",
					Gitea: "https://edent.github.io/SuperTinyIcons/images/svg/gitea.svg",
					Droneio: "https://edent.github.io/SuperTinyIcons/images/svg/drone.svg",
					RubyGems: "https://edent.github.io/SuperTinyIcons/images/svg/rubygems.svg",
					LuckyFramework: "https://edent.github.io/SuperTinyIcons/images/svg/luckyframework.svg",
					Wekan: "https://edent.github.io/SuperTinyIcons/images/svg/wekan.svg",
					KemalFramework: "https://edent.github.io/SuperTinyIcons/images/svg/kemal.svg",
					RubyOnRails: "https://edent.github.io/SuperTinyIcons/images/svg/rubyonrails.svg",
					Kotlin: "https://edent.github.io/SuperTinyIcons/images/svg/kotlin.svg",
					Crystal: "https://edent.github.io/SuperTinyIcons/images/svg/crystal.svg",
					SemaphoreCI: "https://edent.github.io/SuperTinyIcons/images/svg/semaphoreci.svg",
					DjangoProject: "https://edent.github.io/SuperTinyIcons/images/svg/djangoproject.svg",
					Ruby: "https://edent.github.io/SuperTinyIcons/images/svg/ruby.svg",
					SVG: "https://edent.github.io/SuperTinyIcons/images/svg/svg.svg",
					SVG: "https://edent.github.io/SuperTinyIcons/images/svg/preact.svg",
					Svelte: "https://edent.github.io/SuperTinyIcons/images/svg/svelte.svg",
					CPlusPlus: "https://edent.github.io/SuperTinyIcons/images/svg/cplusplus.svg",
					Elastic: "https://edent.github.io/SuperTinyIcons/images/svg/elastic.svg",
				},
				os: {
					Android: "https://edent.github.io/SuperTinyIcons/images/svg/android.svg",
					ArchLinux: "https://edent.github.io/SuperTinyIcons/images/svg/arch_linux.svg",
					Linux: "https://edent.github.io/SuperTinyIcons/images/svg/linux.svg",
					Ubuntu: "https://edent.github.io/SuperTinyIcons/images/svg/ubuntu.svg",
					Windows: "https://edent.github.io/SuperTinyIcons/images/svg/windows.svg",
					ElementaryOS: "https://edent.github.io/SuperTinyIcons/images/svg/elementaryos.svg",
					Debian: "https://edent.github.io/SuperTinyIcons/images/svg/debian.svg",
					LinuxMint: "https://edent.github.io/SuperTinyIcons/images/svg/linux_mint.svg",
					MacOS: "https://edent.github.io/SuperTinyIcons/images/svg/macos.svg",
					FreeBSD: "https://edent.github.io/SuperTinyIcons/images/svg/freebsd.svg",
				},
				gaming: {
					Steam: "https://edent.github.io/SuperTinyIcons/images/svg/steam.svg",
					GOGcom: "https://edent.github.io/SuperTinyIcons/images/svg/gogcom.svg",
					Ubisoft: "https://edent.github.io/SuperTinyIcons/images/svg/ubisoft.svg",
					Uplay: "https://edent.github.io/SuperTinyIcons/images/svg/uplay.svg",
					ElectronicArts: "https://edent.github.io/SuperTinyIcons/images/svg/ea.svg",
					Minecraft: "https://edent.github.io/SuperTinyIcons/images/svg/minecraft.svg",
					Itchio: "https://edent.github.io/SuperTinyIcons/images/svg/itch_io.svg",
				},
				misc: {
					Calendar: "https://edent.github.io/SuperTinyIcons/images/svg/calendar.svg",
					SlideShare: "https://edent.github.io/SuperTinyIcons/images/svg/slideshare.svg",
					Dropbox: "https://edent.github.io/SuperTinyIcons/images/svg/dropbox.svg",
					PDF: "https://edent.github.io/SuperTinyIcons/images/svg/pdf.svg",
					Digidentity: "https://edent.github.io/SuperTinyIcons/images/svg/digidentity.svg",
					Bluetooth: "https://edent.github.io/SuperTinyIcons/images/svg/bluetooth.svg",
					EPub: "https://edent.github.io/SuperTinyIcons/images/svg/epub.svg",
					NextCloud: "https://edent.github.io/SuperTinyIcons/images/svg/nextcloud.svg",
					RaspberryPi: "https://edent.github.io/SuperTinyIcons/images/svg/raspberry_pi.svg",
					Printer: "https://edent.github.io/SuperTinyIcons/images/svg/print.svg",
					Uber: "https://edent.github.io/SuperTinyIcons/images/svg/uber.svg",
					AmazonS3: "https://edent.github.io/SuperTinyIcons/images/svg/amazon_s3.svg",
					Ansible: "https://edent.github.io/SuperTinyIcons/images/svg/ansible.svg",
					Gojek: "https://edent.github.io/SuperTinyIcons/images/svg/gojek.svg",
					AmazonAlexa: "https://edent.github.io/SuperTinyIcons/images/svg/amazon_alexa.svg",
					Finder: "https://edent.github.io/SuperTinyIcons/images/svg/finder.svg",
					Roundcube: "https://edent.github.io/SuperTinyIcons/images/svg/roundcube.svg",
					Fritz: "https://edent.github.io/SuperTinyIcons/images/svg/fritz.svg",
					JacobinMagazine: "https://edent.github.io/SuperTinyIcons/images/svg/jacobin.svg",
					Keskonfai: "https://edent.github.io/SuperTinyIcons/images/svg/keskonfai.svg",
					SublimeText: "https://edent.github.io/SuperTinyIcons/images/svg/sublimetext.svg",
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




