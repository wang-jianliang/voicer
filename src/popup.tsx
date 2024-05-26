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
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      <input onChange={(e) => setData(e.target.value)} value={data} />
      <footer>Popup</footer>
    </div>
  )
}

export default IndexPopup
