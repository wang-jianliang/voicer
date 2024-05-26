import { useState } from "react"
import {DEBUG} from "~constants";

if (!DEBUG) {
  console.log = () => {}
}

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 200,
        padding: 16
      }}>
      <h1>
        Welcome to voicer!
      </h1>
      <footer>voicer</footer>
    </div>
  )
}

export default IndexPopup
