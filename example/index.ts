import * as DetaOrm from '../src/index' // import * as DetaOrm from 'deta-base-orm'

const run = async () => {

	// โจ Define a schema for the kittens
	type KittenSchema = {
		name: string,
		cuteness?: number
	}

	const schema = new DetaOrm.Schema<KittenSchema>({
		name: 'string',
		cuteness: {
			type: 'number',
			default: 0
		}
	})

	// ๐ Create our Kitten base
	const Kitten = new DetaOrm.Base('Kitten', schema)

	// ๐ฑ Create a new kitten
	const line = Kitten.create({
		name: 'Line',
		cuteness: 8
	})

	// ๐ Access the kittens name
	console.log(line.name) // 'Line'

	// ๐พ Save our kitten to the Deta Base
	await line.save()

	// ๐ Find all kittens
	const kittens = await Kitten.find()
	console.log(kittens) // [{name: 'Line', cuteness: 8}, ...]

	// ๐ Find a kitten by its key
	const sameKitten = await Kitten.findByKey(line.key)
	console.log(sameKitten) // {name: 'Line', cuteness: 8}

	// ๐งต Find a kitten by its cuteness
	const cutest = await Kitten.find({ cuteness: 8 })
	console.log(cutest) // [{name: 'Line', cuteness: 8}]

	// ๐ Delete a kitten
	await sameKitten?.delete()
}

run()