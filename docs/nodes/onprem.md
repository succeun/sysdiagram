# OnPrem

Node classes list of onprem provider.

<script>listResources("onprem");</script>

```js
ctx.attributes.graphviz.engine = 'fdp'

var providerName = 'onprem'

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