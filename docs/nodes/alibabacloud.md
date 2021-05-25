# AlibabaCloud

Node classes list of [AlibabaCloud](https://github.com/mingrammer/diagrams/tree/master/resources/alibabacloud) provider.

<script>listResources("alibabacloud");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'alibabacloud'

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
