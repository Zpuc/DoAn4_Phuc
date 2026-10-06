import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <Link className="brand" to="/" aria-label="AUTOBOT home">
        <span className="brand-mark">AB</span>
        <span>AUTOBOT</span>
      </Link>
      <p> AUTOBOT Gundam Store .</p>
      <div>
        <a href="/#shop">Sản phẩm</a>
        <a href="/#grades">Phân loại Grade</a>
        <a href="/#story">Về chúng tôi</a>
      </div>
    </footer>
  )
}
