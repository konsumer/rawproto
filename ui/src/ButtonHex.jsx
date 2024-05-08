import { useRef, useState } from 'react'

const fromHexString = (hexString) => Uint8Array.from(hexString.split(' ').filter(e => e).map((byte) => parseInt(byte, 16)))

export default function ButtonHex ({ className = 'btn btn-neutral', children = 'STRING', onChange }) {
  const [value, setValue] = useState('')
  const r = useRef()

  const handleButtonClick = () => r.current.showModal()
  const handleOkClick = () => onChange(fromHexString(value))
  const handleHexChange = e => setValue(e.target.value)

  return (
    <>
      <button onClick={handleButtonClick} className={className}>{children}</button>
      <dialog ref={r} className='modal'>
        <div className='modal-box'>
          <h3 className='font-bold text-lg'>String Byte Input</h3>
          <p className='py-4'>Input your hex-string here.</p>
          <textarea placeholder='08 96 01 0a ..' className='textarea textarea-bordered textarea-lg w-full' value={value} onChange={handleHexChange} />
          <form method='dialog' className='modal-action gap-2'>
            <button className='btn'>Close</button>
            <button className='btn btn-primary' onClick={handleOkClick}>Ok</button>
          </form>
        </div>
      </dialog>
    </>
  )
}
