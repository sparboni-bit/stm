import { SeedPlacementGenerator } from "../modules/stage-engines/libs/bracket"

const generator = new SeedPlacementGenerator()

for (const size of [2, 4, 8, 16, 32]) {

  console.log("")
  console.log(`SIZE ${size}`)

  console.log(
    generator.generateSeedOrder(size),
  )

}