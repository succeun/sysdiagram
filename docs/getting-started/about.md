# About Sysdiagram

**Diagram as Code for prototyping cloud system architectures using Javascript Syntax.**

Sysdiagram was developed inspired by [Diagrams using Python](https://diagrams.mingrammer.com/), thanks to [mingrammer - MinJae Kwon](https://github.com/mingrammer).

It is a Javascript based diagramming tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically. 



The main purpose of Sysdiagram is to help with Visualizing Documentation, and helping it catch up with Development.

Diagramming and Documentation costs precious developer time and gets outdated quickly.
But not having diagrams or docs ruins productivity and hurts organizational learning. 

Sysdiagram is cutting the time, effort and tooling that is required to create modifiable diagrams and charts, for smarter and more reusable content.
Sysdiagram, as a text-based diagramming tool allows for quick and easy updates, it can also be made part of production scripts (and other pieces of code), to make documentation much easier.

> Sysdiagram is a Diagramming tool for everyone.

Even non-programmers can create diagrams through the [Sysdiagram Live Editor](live-editor.html), Visit the [Tutorials Page](./Tutorials.md).

Many editors, wikis and other tools also have mermaid integrations and plugins, making it easy to start using mermaid. A few of those are described in [Simple start to write diagrams](./n00b-gettingStarted.md).

For a more detailed introduction to Mermaid and some of it's more basic uses, look to the [Overview for Beginners](./n00b-overview.md) and [Usage](./usage.md).


# Diagram

```js
var EC2 = diagrams.aws.compute.EC2
var RDS = diagrams.aws.database.RDS
var ELB = diagrams.aws.network.ELB

Diagram("Web Service", function() {
    ELB("lb")._$(EC2("web"))._$(RDS("userdb"))
})
```

