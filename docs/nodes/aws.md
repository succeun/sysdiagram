# AWS

Node classes list of [AWS](https://github.com/mingrammer/diagrams/tree/master/resources/aws) provider.

<script>listResources("aws");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'aws'

Diagram(providerName, () => {
	Cluster(providerName, () => {
		var provider = diagrams[providerName]
		for (var resourceGroupName in provider) {
			Cluster(providerName + '.' + resourceGroupName, () => {
				var resources = provider[resourceGroupName]
				for (var resourceName in resources) {
					ctx[providerName + '_' + resourceGroupName + '_' + resourceName] = resources[resourceName](resourceName)
				}
			})
			
		}
	})
})
```