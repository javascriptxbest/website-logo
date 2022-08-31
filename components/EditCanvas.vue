<!-- Make an image croppable with tool -->

<template>
  <canvas ref="canvas" class="edit-canvas" />
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from "vue"

const canvas = ref<HTMLCanvasElement | null>( null )
const emit = defineEmits<{
  (e: 'points', points: [number, number][]): void
}>()

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
	run: boolean
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
	run: false,
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

interface isReady extends Data {
	ctx: CanvasRenderingContext2D
	state: State & {path: Path2D}
	canvas: {position: Vector}
}

const ready = (d: Data): d is isReady =>
	!!(d.ctx && data.state.path && data.canvas.position)

const s = 600

const rgb = (x: number, y: number, img: ImageData) =>
{
	const r = img.data[(s * 4) * y + (x * 4)]
	const g = img.data[(s * 4) * y + (x * 4) + 1]
	const b = img.data[(s * 4) * y + (x * 4) + 2]
	const a = img.data[(s * 4) * y + (x * 4) + 3]
	return {r,g,b,a}
}

const col = (x: number, y: number, img: ImageData, r: number, g: number, b: number) =>
{
	img.data[(s * 4) * y + (x * 4)] = r
	img.data[(s * 4) * y + (x * 4) + 1] = g
	img.data[(s * 4) * y + (x * 4) + 2] = b
}

let d = 0.1
const kNN: [string, [number, number]][] = [
	[``, [0, 0]],
	[``, [0, 0]],
	[``, [0, 0]],
	[``, [0, 0]]
]
const stk = []
const draw = () =>
{
	if (!ready(data)) return

	if (!data.setImage)
	{
		data.ctx.canvas.width = s
		data.ctx.canvas.height = s
		data.setImage = true
		const rect = data.ctx.canvas.getBoundingClientRect()
		data.canvas.position.x = rect.x
		data.canvas.position.y = rect.y
	}

	data.ctx.fillStyle = `#000`
	data.ctx.fillRect(0, 0, data.ctx.canvas.width, data.ctx.canvas.height)
	data.ctx.font = `16px Arial`
	const text = `JAVASCRIPT`.split(``).join(`     `)
	const {width} = data.ctx.measureText(text)
	// want text to sit in the middle and take maybe 50%
	const size = 16 / (width / (data.ctx.canvas.width * 0.8))
	data.ctx.font = `${size}px Arial`
	const {width: w2} = data.ctx.measureText(text)
	data.ctx.fillStyle = `#FFF`
	data.ctx.scale(1, 6)
	data.ctx.fillText(text, 0.1 * data.ctx.canvas.width, 0.08 * data.ctx.canvas.height)

	data.ctx.setTransform(1, 0, 0, 1, 0, 0)
	

	const baseimg = data.ctx.getImageData(0, 0, data.ctx.canvas.width, data.ctx.canvas.height)

	let visited = {}
	for (let y = 0; y < s; y += 1) {
		for (let x = 0; x < s; x += 1) {
			const k = `${x}_${y}`
			if (visited[k]) continue
			const pxl = rgb(x, y, baseimg)
			// if (pxl.r !== 0 || pxl.g !== 0 || pxl.b !== 0) {
			if (pxl.r === 255 && pxl.g === 255 && pxl.b === 255) {
				if (Math.random() < 0.5) continue
				stk.push([x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1])
				let r = 0.01
				while(stk.length > 0) {
					const item = stk.pop()
					const kN = `${item[0]}_${item[1]}`;
					if (visited[kN] && Math.random() > r * 0.01) continue
					const pxlN = rgb(item[0], item[1], baseimg)
					visited[kN] = true
					const pxlN0 = (pxlN.r !== 255 && pxlN.g !== 255 && pxlN.b !== 255)
					if (pxlN0) {
						if (Math.random() > r)
						{	
							data.ctx.fillStyle = `rgba(255,255,255,${1 - (r * 0.1)})`;
							data.ctx.fillRect(item[0], item[1], 1, 1)
							kNN[0][0] = `${item[0] - 1}_${item[1]}`
							kNN[0][1][0] = item[0] - 1
							kNN[0][1][1] = item[1]
							kNN[1][0] = `${item[0]}_${item[1] - 1}`
							kNN[1][1][0] = item[0]
							kNN[1][1][1] = item[1] - 1
							kNN[2][0] = `${item[0] + 1}_${item[1]}`
							kNN[2][1][0] = item[0] + 1
							kNN[2][1][1] = item[1]
							kNN[3][0] = `${item[0]}_${item[1] + 1}`
							kNN[3][1][0] = item[0]
							kNN[3][1][1] = item[1] + 1
							for (var i = kNN.length - 1; i > 0; i--) {
								var rand = Math.floor(Math.random() * (i + 1));
								[kNN[i], kNN[rand]] = [kNN[rand], kNN[i]]
							}
							stk.push(kNN[0][1])
							stk.push(kNN[1][1])
							stk.push(kNN[2][1])
							stk.push(kNN[3][1])
							// let x = `1111`;
							// while(Number(x) > 0) {
							// 	const index = Math.random() * Number(x)
							// 	x.replace()
							// 	const i = kNN.splice(~~(Math.random() * kNN.length), 1)[0]
							// 	stk.push(i[1])
							// }
							r += 0.001
							// r += d
						}
					}
				}
			}
		}
	}
	// d -= 0.001
	// if (data.run && d > 0.00001) setTimeout(() => draw(), 10)
}

const start = () =>
{
	const c = canvas.value

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
	data.run = true
	draw(performance.now())
}

onMounted( start )
onUnmounted( () => {
	data.run = false
} )
</script>

<style scoped>
.edit-canvas {
	width: 1000px;
	height: 1000px;
	/* image-rendering: pixelated; */
}
</style>
