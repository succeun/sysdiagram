# GCP

Node classes list of [GCP](https://github.com/mingrammer/diagrams/tree/master/resources/gcp) provider.

<script>listResources("gcp");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'gcp'

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
