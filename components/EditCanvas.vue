<!-- Make an image croppable with tool -->

<template>
<div @click="loading = true">
	<img v-if="!loading" :src="src" width="900" height="450" />
	<span v-else>Loading...</span>
</div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from "vue"

const src = ref('')
const loading = ref(false)

interface State {
	pathEnd: boolean
	points: [number, number][]
	path?: Path2D
}

interface Vector {
	x: number
	y: number
}

interface Data {
	ctx?: CanvasRenderingContext2D
	setImage: boolean
	state: State
	canvas: {
		position?: Vector
	}
	cut: {
		dash: number[]
		base: []
		position?: Vector
		color: {
			base: string
			dash: string
		}
		ending: boolean
	}
}

const data: Data = {
	setImage: false,
	state: {
		pathEnd: false,
		points: []
	},
	canvas: {},
	cut: {
		dash: [5,5],
		base: [],
		color: {
			base: `#000`,
			dash: `#FFF`
		},
		ending: false
	}
}

const s = 600

const rgb = (x: number, y: number, img: ImageData) =>
{
	const r = img.data[(s * 4) * y + (x * 4)]
	const g = img.data[(s * 4) * y + (x * 4) + 1]
	const b = img.data[(s * 4) * y + (x * 4) + 2]
	const a = img.data[(s * 4) * y + (x * 4) + 3]
	return {r,g,b,a}
}

const create = (
	cutoff: number | undefined, 
	{r,g,b}: {r: number, g: number, b: number}, 
	alpha: number, 
	blackTrue: boolean, 
	goUp: boolean, 
	randIncr: number) =>
{
	const baseimg = data.ctx.getImageData(0, 0, data.ctx.canvas.width, data.ctx.canvas.height)
	const visited = {}
	for (let y = 0; y < data.ctx.canvas.height; y += 1) {
		for (let x = 0; x < data.ctx.canvas.width; x += 1) {
			const k = `${x}_${y}`
			if (visited[k]) continue
			const pxl = rgb(x, y, baseimg)
			visited[k] = true
			if (!(pxl.r !== 0 || pxl.g !== 0 || pxl.b !== 0)) continue
			const stk = [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]];
			let rand = 0.01
			while(stk.length > 0) {
				const item = stk.pop()
				const kN = `${item[0]}_${item[1]}`;
				if (visited[kN] && (cutoff === undefined || Math.random() > rand * cutoff)) continue
				const pxlN = rgb(item[0], item[1], baseimg)
				visited[kN] = true
				const pxlN0 = blackTrue
					? (pxlN.r === 0 && pxlN.g === 0 && pxlN.b === 0)
					: (pxlN.r !== 255 && pxlN.g !== 255 && pxlN.b !== 255)
				if (!(pxlN0 && Math.random() > rand)) continue
				data.ctx.fillStyle = `rgba(${r},${g},${b},${1 - (rand * alpha)})`;
				data.ctx.fillRect(item[0], item[1], 1, 1)
				const kNN: [string, [number, number]][] = [
					[`${item[0] - 1}_${item[1]}`, [item[0] - 1, item[1]]],
					[`${item[0]}_${item[1] + 1}`, [item[0], item[1] + 1]],
					[`${item[0] + 1}_${item[1]}`, [item[0] + 1, item[1]]]
				]
				if (goUp) kNN.push(
					[`${item[0]}_${item[1] - 1}`, [item[0], item[1] - 1]])
				while(kNN.length) {
					const i = kNN.splice(~~(Math.random() * kNN.length), 1)[0]
					stk.push(i[1])
				}
				rand += randIncr
			}
		}
	}
}


const draw = () =>
{
	data.ctx.canvas.width = s
	data.ctx.canvas.height = s * 0.5

	data.ctx.fillStyle = `#000`
	data.ctx.fillRect(0, 0, data.ctx.canvas.width, data.ctx.canvas.height)
	data.ctx.font = `16px Arial`
	const text = `JAVASCRIPT`.split(``).join(`     `)
	const {width} = data.ctx.measureText(text)
	// want text to sit in the middle and take maybe 60%
	const size = 16 / (width / (data.ctx.canvas.width * 0.6))
	data.ctx.font = `${size}px Arial`
	data.ctx.fillStyle = `#FFF`
	data.ctx.scale(1, 6)
	data.ctx.fillText(text, 0.2 * data.ctx.canvas.width, 0.08 * data.ctx.canvas.height)

	data.ctx.setTransform(1, 0, 0, 1, 0, 0)
	
	create(10, {r: 255, g: 255, b: 255}, 0.1, false, true, 0.001)
	create(1, {r: 95, g: 95, b: 95}, 2, false, true, 0.001)
	create(10, {r: 200, g: 200, b: 200}, 10, true, true, 0.001)
	create(undefined, {r: 75, g: 75, b: 75}, 7, true, false, 0.0005)

	let baseimg = data.ctx.getImageData(0, 0, data.ctx.canvas.width, data.ctx.canvas.height)

	data.ctx.canvas.width *= 1.5
	data.ctx.canvas.height *= 1.5

	data.ctx.putImageData(baseimg, 0, 0)
	data.ctx.scale(1.5, 1.5)
	data.ctx.drawImage(data.ctx.canvas, 0, 0)
	src.value = data.ctx.canvas.toDataURL('image/webp')
	loading.value = false
}

watch([loading], () => {
	if (loading.value) requestAnimationFrame(() => {
		src.value = ''
		requestAnimationFrame(draw)
	})
})

const start = () =>
{
	const c = document.createElement(`canvas`)

	if ( !c || !( c instanceof HTMLCanvasElement ) )
	{
		throw new Error( `No canvas` )
	}

	data.ctx = c.getContext( `2d` )

	if ( !data.ctx )
	{
		throw new Error( `No context` )
	}

	data.canvas.position = {x: 0, y: 0}
	data.state.path = new Path2D()
	loading.value = true
}


onMounted( start )
</script>

<style scoped>
div {
	color: white;
	width: 900px;
	height: 450px;
	display: grid;
	place-items: center;
}
div img {
	mask-image: url(~/assets/border.svg);
	mask-size: 100% 100%;
	-webkit-mask-image: url(~/assets/border.svg);
	-webkit-mask-size: 100% 100%;
}
</style>
