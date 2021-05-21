# About Sysdiagram

**Diagram the system architecture using JavaScript syntax.**

Sysdiagram was developed inspired by [Diagrams using Python](https://diagrams.mingrammer.com/), thanks to [mingrammer(MinJae Kwon)](https://github.com/mingrammer).

It is a Javascript based diagramming tool that renders text like Markdown definitions to create and modify diagrams dynamically. 


?> Diagrams currently supports six major providers: `AWS`, `Azure`, `GCP`, `Kubernetes`, `Alibaba Cloud` and `Oracle Cloud`. 
It now also supports `On-Premise` nodes as well as `Programming Languages` and `Frameworks`.

# Diagram

```js
var EC2 = diagrams.aws.compute.EC2
var RDS = diagrams.aws.database.RDS
var ELB = diagrams.aws.network.ELB

Diagram("Web Service", function() {
    ELB("lb")._$(EC2("web"))._$(RDS("userdb"))
})
```

