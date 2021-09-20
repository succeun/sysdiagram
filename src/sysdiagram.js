import Canvg from 'canvg';
import * as d3 from 'd3-selection';
import * as d3Graphviz from 'd3-graphviz';
const _ = d3Graphviz.graphviz;

import diagramResources from "./sysdiagram-resources";

// sysdiagram.js
// version : ${SYSDIAGRAM_VERSION}
// authors : Jeong-Ho, Eun
// license : MIT
// https://succeun.github.io/sysdiagram

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
		useWorker: false,
		useSharedWorker: false,
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
			"[data-sysdiagram-processed=true].fullscreen": {
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
			"[data-sysdiagram-processed=true].fullscreen svg": {
				"max-width": "100% !important",
				"max-height": "100% !important",
				//"height": "auto",
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
	
	try {
		ctx['eval'](script);
	} catch(e) {
		printError(e, script);
		if (ctx.onErrorOccurred) {
			ctx.onErrorOccurred(e);
		} else {
			throw e;
		}
	}
	
	if (ctx.attributes.fullscreen.enable) {
		initFullscreen();
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
				init(selector, attributes);
			});
		} else {
			console.warn("Sysdiagram is already running on load.");
		}
		isLoaded = true;
	} else {
		init(selector, attributes, callbackFunc);
	}
}

function init(selector, attributes, callbackFunc) {
	// Change default attributes
	defaultAttrs = mergeAttrs(defaultAttrs, attributes);
	
	var elements = document.querySelectorAll(selector);
	for (var i = 0 ; i < elements.length; i++) {
		var element = elements[i];
		var code = getTextCode(element);
		if (!code) {
			code = element.getAttribute("data-sysdiagram-function");
			code = window[code];	// get function object from function name(string)
		}
		if (!code) {
			throw new Error("Not found script code from inner html or attribute.");
		}
		element.innerHTML = "";
		render(element, code, {}, function(element, graphviz) {
			if (callbackFunc) {
				callbackFunc(element, graphviz);
			}
		});
	}
}

function initWithCode(code, selector, attributes, callbackFunc) {
	// Change default attributes
	defaultAttrs = mergeAttrs(defaultAttrs, attributes);
	
	var element = (typeof selector == "string") ? document.querySelector(selector) : selector;
	render(element, code, {}, function(element, graphviz) {
		if (callbackFunc) {
			callbackFunc(element, graphviz);
		}
	});
}

	

///////////////////////////////////////////////////////////////////////////
// Load Resources

var diagrams = {};	// Preset namespace resources to be used in scripts

function loadResources(resourceJson, baseUrl) {
	if (!isLoadedResources) {
		resourceJson = resourceJson || diagramResources;
		baseUrl = baseUrl || diagramResources.baseUrl;
		
		var baseUrl = baseUrl || "https://raw.githubusercontent.com/mingrammer/diagrams/master/resources";
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
	var v = Canvg.fromString(canvasCtx, svgData, {
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
	version: SYSDIAGRAM_VERSION,
	initialize: initialize,
	init: init,
	initWithCode: initWithCode,
	loadResources: loadResources,
	attributes: defaultAttrs,
	generate: generate,
	render: render,
	toImage: toImage,
	util: {
		getTextCode: getTextCode
	},
};

export default sysdiagram;

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
			
		nodes.style("transition", "all 0.3s");
		edges.selectAll("path").style("transition", "all 0.3s");
		edges.selectAll("polygon").style("transition", "all 0.3s");
		edges.selectAll("text").style("transition", "all 0.3s");
		
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
