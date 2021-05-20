

# Installation

## CDN

```
https://unpkg.com/sysdiagram@<version>/dist/
```

To select a version:

Replace `<version>` with the desired version number.

Latest Version: [https://unpkg.com/browse/sysdiagram@0.1.0/](https://unpkg.com/browse/sysdiagram@0.1.0/)

## [Sysdiagram API](./Setup.md):

**It can insert a `script` tag with an absolute address and a `sysdiagram` call into the HTML like so:**

```html
<!-- canvg for converting image (Optional) -->
<script type="text/javascript" src="https://unpkg.com/canvg@3.0.7/lib/umd.js"></script>

<!-- d3 & d3-graphviz (Mandatory) -->
<script src="https://d3js.org/d3.v5.min.js"></script>
<script src="https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js"></script>
<script src="https://unpkg.com/d3-graphviz@3.0.5/build/d3-graphviz.js"></script>

<!-- sysdiagram -->
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/succeun/sysdiagram@master/sysdiagram_resources.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/succeun/sysdiagram@master/sysdiagram.js"></script>
  
<script>sysdiagram.initialize({startOnLoad:true});</script>
```
**Doing so will command the sysdiagram parser to look for the `<div>` tags with `class="sysdiagram"`. From these tags sysdiagram will try to read the diagram definitons and render them into svg charts.**

```html
<div class="sysdiagram">
	var EC2 = diagrams.aws.compute.EC2

	Diagram("Simple Diagram", function() {
		EC2("web")
	})
</div>
```

 **Examples can be found in** [Other examples](getting-started/examples)


## Credits

Many thanks to the [d3](http://d3js.org/) and [d3-graphviz](https://github.com/magjac/d3-graphviz) projects for providing the graphical layout and drawing libraries!

Thanks also to the [Diagrams using Python](https://diagrams.mingrammer.com/) project for usage of the python syntax. Thanks to [mingrammer - MinJae Kwon](https://github.com/mingrammer) for inspiration and starting point for rendering.


