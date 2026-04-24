import "./News.css";
import featuredNews from "../../data/Featured-New.json";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
}

function News() {
  return (
    <section className="news-page">
      <h1 className="news-title">Tin Tức</h1>
      <div className="news-list">
        {(featuredNews as NewsItem[]).map((news) => (
          <article key={news.id} className="news-item">
            <img src={news.image} alt={news.title} className="news-image" />
            <div className="news-content">
              <h2>{news.title}</h2>
              <p>{news.content}</p>
              <a href="#" className="read-more">
                Đọc thêm →
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default News;
