import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { resolve, join } from "node:path"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const workDir = resolve(root, ".mobile-build-work")
const sourceAppDir = resolve(root, "app")
const mobileAppDir = resolve(workDir, "app")
const rootOutDir = resolve(root, "out")

const excludedRootEntries = new Set([
  ".git",
  ".next",
  ".mobile-build-work",
  ".app-web-backup",
  "app",
  "node_modules",
  "out",
])

function removeDirectory(path) {
  if (existsSync(path)) {
    rmSync(path, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    })
  }
}

function copyRootProject() {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (excludedRootEntries.has(entry.name)) {
      continue
    }

    const source = join(root, entry.name)
    const destination = join(workDir, entry.name)

    cpSync(source, destination, {
      recursive: true,
      force: true,
    })
  }
}

function createMobileAppTree() {
  mkdirSync(mobileAppDir, { recursive: true })
  mkdirSync(resolve(mobileAppDir, "guest"), { recursive: true })
  mkdirSync(resolve(mobileAppDir, "privacy"), { recursive: true })

  cpSync(
    resolve(sourceAppDir, "layout.tsx"),
    resolve(mobileAppDir, "layout.tsx"),
    { force: true },
  )

  cpSync(
    resolve(sourceAppDir, "globals.css"),
    resolve(mobileAppDir, "globals.css"),
    { force: true },
  )

  const guestPage = readFileSync(
    resolve(sourceAppDir, "guest", "page.tsx"),
    "utf8",
  )

  writeFileSync(
    resolve(mobileAppDir, "guest", "page.tsx"),
    guestPage,
    "utf8",
  )

  cpSync(
    resolve(sourceAppDir, "privacy", "page.tsx"),
    resolve(mobileAppDir, "privacy", "page.tsx"),
    { force: true },
  )

  // Mobile V1:
  // "/" and "/guest/" use the same local Tournament shell.
  writeFileSync(
    resolve(mobileAppDir, "page.tsx"),
    guestPage,
    "utf8",
  )
}

function runMobileBuild() {
  const nextCli = resolve(
    root,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  )

  if (!existsSync(nextCli)) {
    throw new Error(
      `Next CLI not found: ${nextCli}`,
    )
  }

  const result = spawnSync(
    process.execPath,
    [nextCli, "build"],
    {
      cwd: workDir,
      env: {
        ...process.env,
        STM_BUILD_TARGET: "mobile",
      },
      stdio: "inherit",
    },
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `Next mobile build exited with code ${result.status}.`,
    )
  }
}

function publishStaticOutput() {
  const generatedOutDir = resolve(workDir, "out")

  if (!existsSync(generatedOutDir)) {
    throw new Error(
      "Mobile build completed but no out directory was generated.",
    )
  }

  removeDirectory(rootOutDir)

  cpSync(
    generatedOutDir,
    rootOutDir,
    {
      recursive: true,
      force: true,
    },
  )
}

try {
  console.log(
    "\n[mobile-build] Preparing isolated Mobile V1 workspace...",
  )

  removeDirectory(workDir)
  mkdirSync(workDir, { recursive: true })

  console.log(
    "[mobile-build] Copying project without Web/Cloud app routes...",
  )

  copyRootProject()

  console.log(
    "[mobile-build] Creating minimal Mobile V1 app tree...",
  )

  createMobileAppTree()

  console.log(
    "[mobile-build] Running Next static export...\n",
  )

  runMobileBuild()

  console.log(
    "\n[mobile-build] Publishing static output...",
  )

  publishStaticOutput()

  console.log(
    "\n[mobile-build] SUCCESS",
  )

  console.log(
    `[mobile-build] Static application available in: ${rootOutDir}`,
  )
} catch (error) {
  console.error(
    `\n[mobile-build] ${
      error instanceof Error ? error.message : String(error)
    }`,
  )

  process.exitCode = 1
} finally {
  console.log(
    "\n[mobile-build] Cleaning temporary Mobile workspace...",
  )

  try {
    removeDirectory(workDir)
  } catch (cleanupError) {
    console.warn(
      "[mobile-build] Temporary directory could not be completely removed:",
      cleanupError instanceof Error
        ? cleanupError.message
        : String(cleanupError),
    )
  }
}