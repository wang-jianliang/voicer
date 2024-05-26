import { useState } from "react"
import {DEBUG} from "~constants";

if (!DEBUG) {
  console.log = () => {}
}

function IndexOptions() {
  const [data, setData] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h1>
        Welcome to voicer!
      </h1>
    </div>
  )
}

export default IndexOptions
