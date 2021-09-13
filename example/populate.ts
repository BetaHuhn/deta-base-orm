import * as DetaOrm from '../src/index' // import * as DetaOrm from 'deta-base-orm'

const run = async () => {
	// ✨ Define a TS schema for the humans
	type HumanSchema = {
		name: string
	}

	// ✨ Define a TS schema for the kittens
	type KittenSchema = {
		name: string,
		owner?: string | typeof Human
	}

	// 🏃‍♂️ Declare Base for humans
	const Human = new DetaOrm.Base<HumanSchema>('Human', {
		name: 'string'
	})

	// 🛌 Declare Base for kittens
	const Kitten = new DetaOrm.Base<KittenSchema>('Kitten', {
		name: 'string',
		owner: Human
	})

	// 👶 Create new human
	const human = await Human.save({
		name: 'Maxi'
	})

	// 🐱 Create new kitten
	const cat = await Kitten.save({
		name: 'Line',
		owner: human.key
	})

	console.log(cat) // => { name: 'Line', owner: '17be07f6ee7zNXWw' }

	// 🎭 Replace id of the owner with actual data from another Base
	await cat.populate('owner')

	console.log(cat) // => { name: 'Line', owner: { name: 'Maxi' } }
}

run()