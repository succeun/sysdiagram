# Examples

Here are some more examples.

## Grouped Workers on AWS

```js
var EC2 = diagrams.aws.compute.EC2
var RDS = diagrams.aws.database.RDS
var ELB = diagrams.aws.network.ELB

Diagram("Grouped Workers", function() {
	ELB("lb")._$([EC2("worker1"), 
				  EC2("worker2"),
				  EC2("worker3"),
				  EC2("worker4"),
				  EC2("worker5")])._$(RDS("events"))
})
```



## Clustered Web Services

```js
var ECS = diagrams.aws.compute.ECS
var { ElastiCache, RDS } = diagrams.aws.database
var ELB = diagrams.aws.network.ELB
var Route53 = diagrams.aws.network.Route53

Diagram("Clustered Web Services", function() {
	ctx.dns = Route53("dns")
    ctx.lb = ELB("lb")
	
	Cluster("Services", function() {
		ctx.svc_group = [ECS("web1"),
						 ECS("web2"),
						 ECS("web3")]
	})
	
	Cluster("DB Cluster", function() {
		ctx.db_master = RDS("userdb")
		ctx.db_master._([RDS("userdb ro")])
	})
	
	ctx.memcached = ElastiCache("memcached")
	
	ctx.dns._$(ctx.lb)._$(ctx.svc_group)
    ctx.svc_group._$(ctx.db_master)
    ctx.svc_group._$(ctx.memcached)
})
```



## Event Processing on AWS

```js
var { ECS, EKS, Lambda } = diagrams.aws.compute
var Redshift = diagrams.aws.database.Redshift
var SQS = diagrams.aws.integration.SQS
var S3 = diagrams.aws.storage.S3

Diagram("Event Processing", function() {
	ctx.source = EKS("k8s source")
	Cluster("Event Flows", function() {
		Cluster("Event Workers", function() {
			ctx.workers = [ECS("worker1"),
						   ECS("worker2"),
						   ECS("worker3")]
		})
	
		ctx.queue = SQS("event queue")
	
		Cluster("Event Flows", function() {
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



## Message Collecting System on GCP

```js
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




## Exposed Pod with 3 Replicas on Kubernetes

```js
var HPA = diagrams.k8s.clusterconfig.HPA
var { Deployment, Pod, ReplicaSet }  = diagrams.k8s.compute
var { Ingress, Service } = diagrams.k8s.network

Diagram("Exposed Pod with 3 Replicas", () => {
	ctx.net = Ingress("domain.com")._$(Service("svc"))
    ctx.net._$([Pod("pod1"),
                Pod("pod2"),
                Pod("pod3")]).$_(ReplicaSet("rs")).$_(Deployment("dp")).$_(HPA("hpa"))
})
```



## Stateful Architecture on Kubernetes

```js
var { Pod, StatefulSet } = diagrams.k8s.compute
var Service = diagrams.k8s.network.Service
var { PV, PVC, StorageClass } = diagrams.k8s.storage

Diagram("Stateful Architecture", () => {
	Cluster("Apps", () => {
        ctx.svc = Service("svc")
        ctx.sts = StatefulSet("sts")

        ctx.apps = []
        for (var i = 0; i < 3; i++) {
            ctx.pod = Pod("pod")
            ctx.pvc = PVC("pvc")
            ctx.pod._(ctx.sts)._(ctx.pvc)
            ctx.apps.push(ctx.svc._$(ctx.pod)._$(ctx.pvc))
		}
	})

    ctx.apps.$_(PV("pv")).$_(StorageClass("sc"))
})
```

## Advanced Web Service with On-Premise

```js
var Spark = diagrams.onprem.analytics.Spark
var Server = diagrams.onprem.compute.Server
var PostgreSQL = diagrams.onprem.database.Postgresql
var Redis = diagrams.onprem.inmemory.Redis
var Fluentd = diagrams.onprem.aggregator.Fluentd
var { Grafana, Prometheus } = diagrams.onprem.monitoring
var Nginx = diagrams.onprem.network.Nginx
var Kafka = diagrams.onprem.queue.Kafka

Diagram("Advanced Web Service with On-Premise", function() {
	ctx.ingress = Nginx("ingress")
	
	ctx.metrics = Prometheus("metric")
	ctx.metrics.$_(Grafana("monitoring"))

	Cluster("Service Cluster", () => {
		ctx.grpcsvc = [Server("grpc1"), 
			           Server("grpc2"), 
			           Server("grpc3")]
	})

	Cluster("Sessions HA", () => {
		ctx.master = Redis("session")
		ctx.master._(Redis("replica")).$_(ctx.metrics)
		ctx.grpcsvc._$(ctx.master)
	})

	Cluster("Database HA", () => {
		ctx.master = PostgreSQL("users")
		ctx.master._(PostgreSQL("slave")).$_(ctx.metrics)
		ctx.grpcsvc._$(ctx.master)
	})
	
	ctx.aggregator = Fluentd("logging")
	ctx.aggregator._$(Kafka("stream"))._$(Spark("analytics"))

	ctx.ingress._$(ctx.grpcsvc)._$(ctx.aggregator)
})
```



## Advanced Web Service with On-Premise (with colors and labels)

```js
var Spark = diagrams.onprem.analytics.Spark
var Server = diagrams.onprem.compute.Server
var PostgreSQL = diagrams.onprem.database.Postgresql
var Redis = diagrams.onprem.inmemory.Redis
var Fluentd = diagrams.onprem.aggregator.Fluentd
var { Grafana, Prometheus } = diagrams.onprem.monitoring
var Nginx = diagrams.onprem.network.Nginx
var Kafka = diagrams.onprem.queue.Kafka

Diagram("Advanced Web Service with On-Premise (colored)", function() {
	ctx.ingress = Nginx("ingress")
	
	ctx.metrics = Prometheus("metric")
	ctx.metrics.$_(Edge({color: "firebrick", style: "dashed"})).$_(Grafana("monitoring"))

	Cluster("Service Cluster", () => {
		ctx.grpcsvc = [ Server("grpc1"), 
			            Server("grpc2"), 
			            Server("grpc3")]
	})

	Cluster("Sessions HA", () => {
		ctx.master = Redis("session")
		ctx.master._(Edge({color: "brown", style: "dashed"}))._(Redis("replica")).$_(Edge({label: "collect"})).$_(ctx.metrics)
		ctx.grpcsvc._$(Edge({color: "brown"}))._$(ctx.master)
	})

	Cluster("Database HA", () => {
		ctx.master = PostgreSQL("users")
		ctx.master._(Edge({color: "brown", style: "dotted"}))._(PostgreSQL("slave")).$_(Edge({label: "collect"})).$_(ctx.metrics)
		ctx.grpcsvc._$(Edge({color: "black"}))._$(ctx.master)
	})
	
	ctx.aggregator = Fluentd("logging")
	ctx.aggregator._$(Edge({label: "parse"}))._$(Kafka("stream"))._$(Edge({color: "black", style: "bold"}))._$(Spark("analytics"))

	ctx.ingress.$_$(Edge({color: "darkgreen"})).$_$(ctx.grpcsvc)._$(Edge({color: "darkorange"}))._$(ctx.aggregator)
})
```


## RabbitMQ Consumers with Custom Nodes

```js
var Aurora = diagrams.aws.database.Aurora
var Pod = diagrams.k8s.compute.Pod

var rabbitmq_icon = "https://jpadilla.github.io/rabbitmqapp/assets/img/icon.png";

Diagram("Broker Consumers", function() {
	Cluster("Consumers", function() {
        ctx.consumers = [Pod("worker"),
                         Pod("worker"),
                         Pod("worker")]
	})

    ctx.queue = Custom("Message queue", rabbitmq_icon)

    ctx.queue._$(ctx.consumers)._$(Aurora("Database"))
})
```

