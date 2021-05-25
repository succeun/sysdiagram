# Configuration

You can change the setting information to change the rendering.

## Basic

The setting information is divided into the following areas.

- `digraph`: Direct Graph(digraph) attributes in Graphviz's [DOT](https://www.graphviz.org/doc/info/lang.html) language syntax
- `node`: Node attributes in Graphviz's [DOT](https://www.graphviz.org/doc/info/lang.html) language syntax
- `edge`: Edge attributes in Graphviz's [DOT](https://www.graphviz.org/doc/info/lang.html) language syntax
- `subgraph`: Subgraph attributes in Graphviz's [DOT](https://www.graphviz.org/doc/info/lang.html) language syntax
- `subgraphBgcolors`: Background color for Nested Clusters
- `graphviz`: Options of [D3-graphviz](https://github.com/magjac/d3-graphviz#supported-options)
- `iconSize`: Size of Icon image
- `toImage`: Options for image conversion
- `selector`: CSS selector to find the Sysdiagram
- `startOnLoad`: Whether to navigate and handle in the window's DOMContentLoaded event

### Default Configuration(Attributes)

```javascript
{
	digraph: {						// https://graphviz.org/doc/info/attrs.html
		fontcolor: "#2D3436",
		fontname: "Sans-Serif",
		fontsize: "15",
		nodesep: "0.60",
		pad: "2.0",
		ranksep: "0.75",
		splines: "ortho",			// none(""), line(false), polyline, curved, ortho, spline(true)
		//labelloc: "b",			// t(top), b(bottom, default), c(center)
		
		rankdir: "LR",				// TB(default), LR, BT, RL
		compound: true,				// If true, allow edges between clusters.
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
		target: "_blank",
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
		peripheries: 1,				// border
	},
	subgraphBgcolors: [
		"#E5F5FD", "#EBF3E7", "#ECE8F6", "#FDF7E3", "#FDEAE3", "#E1FCFA", "#FCE1F9"
	],
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
	selector: ".sysdiagram",
	startOnLoad: true,
	verbose: false,					// log output to console
	width: null,					// When you set the width, content's width is set after rendering.
	height: null,					// When you set the height, content's height is set after rendering.
}
```

## Change the default cofiguration

Can be changed to individual items.

```javascript
sysdiagram.attributes.graphviz.engine = "fdp";
sysdiagram.attributes.graphviz.zoom = false;
sysdiagram.attributes.digraph.rankdir = "TB";
sysdiagram.attributes.edge.color = "red";
...

sysdiagram.initialize({startOnLoad: true});
```

You can pass the changes all at once.

```javascript
sysdiagram.initialize({
	startOnLoad: true, 
	graphviz: { engine: "fdp", zoom: false },
	digraph: { rankdir: "TB" },
	edge: { color: "red" },
});
```

## Change the cofiguration in diagram

All settings can be changed within each diagram through the `Context` object.

Also, properties can be defined through the last parameter of `Diagram`, `Cluster`, `Node`, and `Edge`.

```js
ctx.attributes.graphviz.engine = "circo"
ctx.attributes.graphviz.zoom = false
ctx.attributes.digraph.rankdir = "TB"
ctx.attributes.edge.color = "red"

var { EC2 } = diagrams.aws.compute
var { RDS } = diagrams.aws.database
var { ELB } = diagrams.aws.network

Diagram("Simple Diagram", () => {
    ctx.lb = ELB("lb")
    ctx.web1 = EC2("web1")
    ctx.web2 = EC2("web2")
    ctx.db = RDS("userdb")
    
    ctx.lb._$(ctx.web1)._$(ctx.db)
    ctx.lb._$(ctx.web2)._$(ctx.db)
}) 
```
