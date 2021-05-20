# Custom

## Custom with local icons

For this example we use the following architecture:

```js
Diagram("Custom with local icons\n Can be downloaded here: \nhttps://creativecommons.org/about/downloads/", () => {
	ctx.cc_heart = Custom("Creative Commons", "./images/ccheart_black.png")
	ctx.cc_attribution = Custom("Credit must be given to the creator", "./images/by.png")

	ctx.cc_sa = Custom("Adaptations must be shared\n under the same terms", "./images/sa.png")
	ctx.cc_nd = Custom("No derivatives or adaptations\n of the work are permitted", "./images/nd.png")
	ctx.cc_zero = Custom("Public Domain Dedication", "./images/zero.png")

	Cluster("Non Commercial", () => {
		ctx.non_commercial = [Custom("Y", "./images/nc-jp.png")._(Custom("E", "./images/nc-eu.png"))._(Custom("S", "./images/nc.png"))]
	})
	
	ctx.cc_heart._$(ctx.cc_attribution)
	ctx.cc_heart._$(ctx.non_commercial)
	ctx.cc_heart._$(ctx.cc_sa)
	ctx.cc_heart._$(ctx.cc_nd)
	ctx.cc_heart._$(ctx.cc_zero)
}, {rankdir: "LR" })
```


## Custom with remote icons

If your icons are hosted and can be accessed when you generate the diagrams, you can

```js
Diagram("Custom with remote icons", () => {

	var diagrams_url = "https://github.com/mingrammer/diagrams/raw/master/assets/img/diagrams.png"
	ctx.diagrams = Custom("Diagrams", diagrams_url)

	Cluster("Some Providers", () => {

		var openstack_url = "https://github.com/mingrammer/diagrams/raw/master/resources/openstack/openstack.png"
		ctx.openstack = Custom("OpenStack", openstack_url)

		var elastic_url = "https://github.com/mingrammer/diagrams/raw/master/resources/elastic/saas/elastic.png"
		ctx.elastic = Custom("Elastic", elastic_url)
	})
	
  ctx.diagrams._$(ctx.openstack)
  ctx.diagrams._$(ctx.elastic)
  
}, {rankdir: "LR" })
```

## Repeat Custom Nodes

If custom icons are used repeatedly, they can be predefined and used.

```js
ctx.attributes.digraph.splines = 'curved'	// Changed graphviz digraph splines
ctx.attributes.subgraph.labeljust = 'c'		// Justification for cluster labels

var WEB = (name, attrs) => Node(name, attrs, "images/web.png")
var WAS = (name, attrs) => Node(name, attrs, "images/was.png")
var DB = (name, attrs) => Node(name, attrs, "images/database.png")

Diagram("Repeat Custom", () => {
	Cluster("Web Servers", () => {
		ctx.webs = [WEB("web #1"), WEB("web #2")]
	})
	
	Cluster("WAS Servers", () => {
		ctx.wass = [WAS("WAS #1"), WAS("WAS #2")]
	})
	
	Cluster("DB Servers", () => {
		ctx.dbs = [DB("DB #1"), DB("DB #2")]
	})
	
  ctx.webs._$(ctx.wass)._$(ctx.dbs)
  
}, {rankdir: "LR" })
```


Another example can be found [Here](getting-started/examples#rabbitmq-consumers-with-custom-nodes).
