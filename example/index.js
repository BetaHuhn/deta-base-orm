// eslint-disable-next-line @typescript-eslint/no-var-requires
const DetaOrm = require('../lib/index') // const DetaOrm = require('deta-base-orm')

const run = async () => {
	// Create the model
	const Cat = new DetaOrm.Base('Cat')

	// Create a new document of the model
	const cat = Cat.create({
		name: 'Mimi',
		age: 2
	})

	// Save the document to Deta Base
	await cat.save()

	console.log(cat)

	// Delete the document from Deta Base
	await cat.delete()

	// or shorter

	// Crate and save a document
	const cat2 = await Cat.save({
		name: 'Line',
		age: 19
	})

	console.log(cat2)

	// Find all documents
	const cats = await Cat.find()
	console.log(cats)

	// Find a specific document
	const sameCat = await Cat.findOne({ id: cat2.id })

	if (!sameCat) return

	console.log(sameCat)

	await sameCat.delete()
}

run()