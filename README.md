# About

**Diagram the system architecture using JavaScript syntax.**

Sysdiagram was developed inspired by [Diagrams using Python](https://diagrams.mingrammer.com/), thanks to [mingrammer(MinJae Kwon)](https://github.com/mingrammer).

It is a Javascript based diagramming tool that renders text like Markdown definitions to create and modify diagrams dynamically. 


?> Sysdiagram currently supports six major providers: [`AWS`](nodes/aws), [`Azure`](https://succeun.github.io/sysdiagram/#/nodes/aws), [`GCP`](https://succeun.github.io/sysdiagram/#/nodes/gcp), [`Kubernetes`](https://succeun.github.io/sysdiagram/#/nodes/k8s), [`Alibaba Cloud`](https://succeun.github.io/sysdiagram/#/nodes/alibabacloud) and [`Oracle Cloud`](https://succeun.github.io/sysdiagram/#/nodes/oci). <br>
It now also supports [`On-Premise`](https://succeun.github.io/sysdiagram/#/nodes/onprem) nodes as well as [`Programming Languages`](https://succeun.github.io/sysdiagram/#/nodes/programming?id=programminglanguage), [`Frameworks`](https://succeun.github.io/sysdiagram/#/nodes/programming?id=programmingframework) and [`Programs`](https://succeun.github.io/sysdiagram/#/nodes/program).

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


# Diagram

## Simple Example

```javascript
var EC2 = diagrams.aws.compute.EC2
var RDS = diagrams.aws.database.RDS
var ELB = diagrams.aws.network.ELB

Diagram("Web Service", function() {
    ELB("lb")._$(EC2("web"))._$(RDS("userdb"))
})
```
![Web Service](https://succeun.github.io/sysdiagram/images/simple_diagram.png)

## Complex Example

```javascript
var { BigQuery, Dataflow, PubSub } = diagrams.gcp.analytics
var {AppEngine, Functions } = diagrams.gcp.compute
var BigTable = diagrams.gcp.database.BigTable
var IotCore = diagrams.gcp.iot.IotCore
var GCS = diagrams.gcp.storage.GCS

Diagram("Message Collecting", () => {
    ctx.pubsub = PubSub("pubsub")
    
    Cluster("Source of Data", () => {
        ArrayNode([IotCore("core1"),
                   IotCore("core2"),
                   IotCore("core3")])._$(ctx.pubsub)
    })

    Cluster("Targets", () => {
        Cluster("Data Flow", () => {
            ctx.flow = Dataflow("data flow")
        })
        
        Cluster("Data Lake", () => {
            ctx.flow._$([BigQuery("bq"),
                         GCS("storage")])
        })

        Cluster("Event Driven", () => {
            Cluster("Processing", () => {
                ctx.flow._$(AppEngine("engine"))._$(BigTable("bigtable"))
            })

            Cluster("Serverless", () => {
                ctx.flow._$(Functions("func"))._$(AppEngine("appengine"))
            })
        })
    })
    ctx.pubsub._$(ctx.flow)
})
```

![Message Collecting](https://succeun.github.io/sysdiagram/images/complex_diagram.png)

**Examples can be found in** [examples](https://succeun.github.io/sysdiagram/#/getting-started/examples), [Advanced examples](https://succeun.github.io/sysdiagram/#/getting-started/advanced_examples)

## Credits

Many thanks to the [d3](http://d3js.org/) and [d3-graphviz](https://github.com/magjac/d3-graphviz) projects for providing the graphical layout and drawing libraries!

Thanks also to the [Diagrams using Python](https://diagrams.mingrammer.com/) project for usage of the python syntax. 

Thanks to [mingrammer(MinJae Kwon)](https://github.com/mingrammer) for inspiration and starting point for developing.