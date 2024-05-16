export default function ButtonDownloadProto ({ tree, prefix = 'f', typeMap, nameMap, messageName = 'MessageRoot', children = 'Download Proto', className = 'btn btn-secondary', filename = 'download.proto' }) {
  const handleClick = e => {
    const d = tree.toProto(undefined, prefix, nameMap, typeMap, messageName)
    const u = URL.createObjectURL(new Blob([d], { type: 'text/plain' }))
    e.target.setAttribute('href', u)
    setTimeout(() => URL.revokeObjectURL(u), 0)
  }

  return <a className={className} onClick={handleClick} href='#proto' download={filename}>{children}</a>
}
