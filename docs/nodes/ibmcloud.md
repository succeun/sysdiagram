# IBMCloud

Node classes list of [IBMCloud](https://github.com/mingrammer/diagrams/tree/master/resources/ibm) provider.

<script>listResources("ibm");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'ibm'

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
