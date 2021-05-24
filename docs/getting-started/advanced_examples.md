# Advanced Examples

Here are some more advanced examples.

## Company Organization Chart (with HTML-like labels)

```js
ctx.attributes.subgraph.labeljust = 'c'

var Man1 = (name, attrs) => Node(name, attrs, "images/man1.png")
var Woman1 = (name, attrs) => Node(name, attrs, "images/woman1.png")

var Man2 = (name, attrs) => Node(name, attrs, "images/man2.png");
var Woman2 = (name, attrs) => Node(name, attrs, "images/woman2.png");

var Man3 = (name, attrs) => Node(name, attrs, "images/man3.png");
var Woman3 = (name, attrs) => Node(name, attrs, "images/woman3.png");

var Man4 = (name, attrs) => Node(name, attrs, "images/man4.png");
var Woman4 = (name, attrs) => Node(name, attrs, "images/woman4.png");

Diagram("Organization", function() {
	Cluster("CEO", function() {
		ctx.ceo = Woman4("Roxy")
    }, {fontcolor: "orange"})
  	
	Cluster("< <i>Operation Team</i> >", function() {
		ctx.team1 = Man1("Hugh")
		ctx.team1.$_(Woman1("Belle"))
		ctx.team1.$_(Man1("Bruno"))
		ctx.team1.$_(Man3("Eric"))
	}, {fontcolor: "#FF0000", tooltip: "Operation Team"})
  
	Cluster("< <i>Technical Team</i> >", function() {
		ctx.team2 = Woman2("Judith")
		ctx.team2.$_(Man2("Tom"))
		ctx.team2.$_(Man1("Andrew"))
	}, {fontcolor: "blue", tooltip: "Technical Team"})

	Cluster("Commercial Team", function() {
		ctx.team3 = Man3("Leonard")
		ctx.team3.$_(Woman3("Calla"))
		ctx.team3.$_(Man2("Mac"))
		ctx.team3.$_(Woman1("Ruby"))
	}, {fontcolor: "green"})

	Cluster("Human Resources Team", function() {
		ctx.team4 = Man4("Sam")
		ctx.team4.$_(Woman4("Silly"))
		ctx.team4.$_(Woman2("Maggie"))
	})

	ctx.ceo.$_([ctx.team1, ctx.team2, ctx.team3, ctx.team4])
  
}, {rankdir: "TB"})	
```

## Build Cloud Native Applications (with Advanced Edge)

```js
ctx.attributes.edge.fontcolor = "#0079d4"
ctx.attributes.edge.fontsize = "40px"
ctx.attributes.edge.style = "dashed"

var { MicrosoftEdge } = diagrams.program.browser
var { CDNProfiles} = diagrams.azure.network
var { KubernetesServices, FunctionApps } = diagrams.azure.compute
var { CosmosDb, DatabaseForPostgresqlServers, CacheForRedis } = diagrams.azure.database
var { ApplicationInsights } = diagrams.azure.devops
var { NotificationHubs } = diagrams.azure.mobile
var { AnalysisServices } = diagrams.azure.analytics 
var { PowerBI } = diagrams.onprem.analytics

Diagram("Build cloud native applications", () => {
    ctx.browser = MicrosoftEdge("Browser")
	ctx.AKS = KubernetesServices("Azure Kubernetes Service")
	ctx.Insight = ApplicationInsights("Application Insights")
	ctx.AF = FunctionApps("Azure Functions")
	ctx.ASA = AnalysisServices("Azure Synapse Analytics")
	ctx.CosDB = CosmosDb("Azure Cosmos DB")
	
	Cluster("", () => {
		ctx.Postgre = DatabaseForPostgresqlServers("Azure Database for PostgreSQL")
		ctx.AKS.edge("②")._$(ctx.Postgre)
		ctx.AKS.edge("③").$_$(CacheForRedis("Azure Cache for Redis"))
	})
	
	ctx.browser.edge("①")._$(CDNProfiles("Content Delivery Network"))
	ctx.browser._$(ctx.AKS)
	ctx.AKS.edge("⑧")._$(ctx.CosDB)
	ctx.AKS.edge("⑦")._$(ctx.Insight)
	ctx.Insight.edge("⑦").$_(ctx.AF)
	ctx.AF.edge("⑤")._$(NotificationHubs("Notification Hubs"))
	ctx.Postgre.edge("④")._$(ctx.AF)
	ctx.Postgre.edge("⑥")._$(ctx.ASA)
	ctx.ASA.edge("⑩")._$(PowerBI("Power BI"))
	ctx.CosDB.edge("⑨")._$(ctx.ASA)
  
}, {rankdir: "LR", pad: "0.5", nodesep: "1", ranksep: "2", splines: "curved"})
```



