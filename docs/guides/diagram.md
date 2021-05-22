# Diagrams (리소스 임포트 하는 방법)

Diagram is a object representing a diagram.

## Basic

Diagram represents a global diagram graph.

You can create a diagram with Diagram function. 
The first parameter of Diagram function will be used name, the second parameter of the diagram will be the callback function.

```js
var EC2 = diagrams.aws.compute.EC2

Diagram("Simple Diagram", function() {
    EC2("web")
})	
```

## Attributes

It allows custom Graphviz dot attributes.

> `Diagram`, `Cluster`, `Node`, and `Edge` all are supported with last parameter. Here is a [Reference link of Graphviz Attributes](https://www.graphviz.org/doc/info/attrs.html).

```js
var EC2 = diagrams.aws.compute.EC2

Diagram("Simple Diagram", () => {
    EC2("web", {height: 2.9, fontsize: 45, fontcolor: "#ff0000"})
	
	Cluster("Simple Cluster", () => {
		EC2("web1", {height: 2.9, fontsize: 45, fontcolor: "#00ff00"})
		._(Edge({color: "brown", style: "dotted"}))
		._(EC2("web2", {height: 2.9, fontsize: 45, fontcolor: "#00ff00"}))
	}, {bgcolor: "#eeeeee"})
}, {bgcolor: "#cccccc"})	
```
