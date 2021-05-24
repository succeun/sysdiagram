# Context

Context(`ctx`) provides the execution context for the script to run.

## Basic

Context object represents a global diagram context.

It is used to **use variables**, **change attributes**, and **receive events**.

### Use variables

If you connect multiple nodes repeatedly, declare them as variables.

> To make a node variable, use `ctx` or `this` global variable.

```js
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

### Change attributes.

We will change the line connecting the node to a curve in Graphviz.

```js
ctx.attributes.digraph.splines = 'curved'

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

!> Attributes to be changed can be checked in [Configuration](guides/configuration).

### Receive events

Receive a rendering complete event.

After rendering is complete, the element surrounding the `svg` is returned to the console window.

```js
ctx.attributes.digraph.splines = 'curved'

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

ctx.onCompleted = function(element, graphviz) {
	console.log(element); 
}
```
