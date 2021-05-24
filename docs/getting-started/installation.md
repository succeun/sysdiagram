

# Installation

## CDN

```
https://unpkg.com/sysdiagram@<version>/dist/sysdiagram.min.js
```

To select a version:

Replace `<version>` with the desired version number.

Latest Version: [https://unpkg.com/sysdiagram/dist/sysdiagram.min.js](https://unpkg.com/sysdiagram/dist/sysdiagram.min.js)

## Installing

It can insert a `script` tag with an absolute address and a `sysdiagram` call into the HTML like so:

```html
<!-- canvg for converting image (Optional) -->
<script src="https://unpkg.com/canvg@^3.0.7/lib/umd.js"></script> 

<!-- d3 & d3-graphviz (Mandatory) -->
<script src="https://unpkg.com/d3@^6.7.0/dist/d3.min.js"></script>
<script src="https://unpkg.com/@hpcc-js/wasm@^1.5.2/dist/index.min.js"></script>
<script src="https://unpkg.com/d3-graphviz@^4.0.0/build/d3-graphviz.js"></script>

<!-- sysdiagram (latest) -->
<script type="text/javascript" src="https://unpkg.com/sysdiagram/dist/sysdiagram.min.js"></script>
  
<script>sysdiagram.initialize({startOnLoad:true});</script>
```

Doing so will command the sysdiagram parser to look for the `<div>` tags with `class="sysdiagram"`. 

From these tags sysdiagram will try to read the diagram definitons and render them into svg charts.

```html
<div class="sysdiagram">
	var EC2 = diagrams.aws.compute.EC2

	Diagram("Simple Diagram", function() {
		EC2("web")
	})
</div>
```

 **Examples can be found in** [Other examples](getting-started/examples)



