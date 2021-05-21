# Clusters

Cluster allows you group (or clustering) the nodes in an isolated group.

## Basic

Cluster represents a local cluster.

You can create a cluster with Cluster function. And you can also connect the nodes in a cluster to other nodes outside a cluster.

```js
var { ECS } = diagrams.aws.compute
var { RDS } = diagrams.aws.database
var { Route53 } = diagrams.aws.network

Diagram("Simple Web Service with DB Cluster", () => {
    ctx.dns = Route53("dns")
    ctx.web = ECS("service")

    Cluster("DB Cluster", () => {
        ctx.db_master = RDS("master")
        ctx.db_master._([RDS("slave1"),
                         RDS("slave2")])
	})
	
    ctx.dns._$(ctx.web)._$(ctx.db_master)
})
```

## Nested Clusters

Nested clustering is also possible.

```js
var { ECS, EKS, Lambda } = diagrams.aws.compute
var { Redshift } = diagrams.aws.database
var { SQS } = diagrams.aws.integration
var { S3 } = diagrams.aws.storage

Diagram("Event Processing", () => {
    ctx.source = EKS("k8s source")

    Cluster("Event Flows", () => {
        Cluster("Event Workers", () => {
            ctx.workers = [ECS("worker1"),
						   ECS("worker2"),
						   ECS("worker3")]
		})

        ctx.queue = SQS("event queue")

        Cluster("Processing", () => {
            ctx.handlers = [Lambda("proc1"),
							Lambda("proc2"),
							Lambda("proc3")]
		})
	})

    ctx.store = S3("events store")
    ctx.dw = Redshift("analytics")

    ctx.source._$(ctx.workers)._$(ctx.queue)._$(ctx.handlers)
    ctx.handlers._$(ctx.store)
    ctx.handlers._$(ctx.dw)
})	
```


> There is no depth limit of nesting. Feel free to create nested clusters as deep as you want.
