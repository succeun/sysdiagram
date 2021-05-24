# Edges

Edge is representing an edge between Nodes.

## Basic

Edge is an object representing a connection between Nodes with some additional graphviz edge attributes.

```js
var { Spark } = diagrams.onprem.analytics
var { Server } = diagrams.onprem.compute
var { PostgreSQL } = diagrams.onprem.database
var { Redis } = diagrams.onprem.inmemory
var { Fluentd } = diagrams.onprem.aggregator
var { Grafana, Prometheus } = diagrams.onprem.monitoring
var { Nginx } = diagrams.onprem.network
var { Kafka } = diagrams.onprem.queue

Diagram(name="Advanced Web Service with On-Premise (colored)", () => {
    ctx.ingress = Nginx("ingress")

    ctx.metrics = Prometheus("metric")
    ctx.metrics._$(Edge({color: "firebrick", style: "dashed"}))._$(Grafana("monitoring"))

    Cluster("Service Cluster", () => {
        ctx.grpcsvc = [
				Server("grpc1"),
				Server("grpc2"),
				Server("grpc3")]
	})

    Cluster("Sessions HA", () => {
        ctx.main = Redis("session")
        ctx.main
            ._(Edge({color: "brown", style: "dashed"}))
            ._(Redis("replica"))
            .$_(Edge({label: "collect"}))
            .$_(ctx.metrics)
        ctx.grpcsvc._$(Edge({color: "brown"}))._$(ctx.main)
	})

    Cluster("Database HA", () => {
        ctx.main = PostgreSQL("users")
        ctx.main
            ._(Edge({color: "brown", style: "dotted"}))
            ._(PostgreSQL("replica"))
            .$_(Edge({label: "collect"}))
            .$_(ctx.metrics)
        ctx.grpcsvc._$(Edge({color: "black"}))._$(ctx.main)
	})

    ctx.aggregator = Fluentd("logging")
    ctx.aggregator
        ._$(Edge({label: "parse"}))
        ._$(Kafka("stream"))
        ._$(Edge({color: "black", style: "bold"}))
        ._$(Spark("analytics"))

    ctx.ingress
        ._$(Edge({color: "darkgreen"}))
        ._$(ctx.grpcsvc)
        ._$(Edge({color: "darkorange"}))
        ._$(ctx.aggregator)
})		
```

## Using

Below all appear the same.

```javascript
	// Edge Node
	ELB("lb")._$(Edge({color: "firebrick", style: "dashed"}))_$(EC2("web"))
	ELB("lb")._$(Edge({label: "connect", color: "firebrick", style: "dashed"}))_$(EC2("web"))
	ELB("lb")._$(Edge("connect", {color: "firebrick", style: "dashed"}))_$(EC2("web"))
	
	// Abbreviated : ~.edge(), ~.e()
	ELB("lb").edge({label: "connect", color: "firebrick", style: "dashed"})._$(EC2("web"))
	ELB("lb").edge("connect", {color: "firebrick", style: "dashed"})._$(EC2("web"))
	ELB("lb").e("connect", {color: "firebrick", style: "dashed"})._$(EC2("web"))
	
	// Use of attributes
	ctx.attributes.edge.color = "firebrick"
	ctx.attributes.edge.style = "dashed"
	...
	ELB("lb").edge("connect")._$(EC2("web"))
	ELB("lb").e("connect")._$(EC2("web"))
```

