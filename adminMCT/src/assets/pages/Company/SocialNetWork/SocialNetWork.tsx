import type { UpdateCompanyField } from "../companyModel";

type SocialNetWorkProps = {
  facebook: string;
  zalo: string;
  whatsapp: string;
  telegram: string;
  tiktok: string;
  instagram: string;
  youtube: string;
  wechat: string;
  updateField: UpdateCompanyField;
};

function SocialNetWork({
  facebook,
  zalo,
  whatsapp,
  telegram,
  tiktok,
  instagram,
  youtube,
  wechat,
  updateField,
}: SocialNetWorkProps) {
  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>Mạng xã hội</h2>
        <p>Liên kết đến các mạng xã hội và ứng dụng nhắn tin của công ty.</p>
      </div>
      <div className="co-grid">
        <div className="co-field">
          <label htmlFor="facebook">Facebook</label>
          <input
            id="facebook"
            type="url"
            value={facebook}
            onChange={(e) => updateField("facebook", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="zalo">Zalo</label>
          <input
            id="zalo"
            type="url"
            value={zalo}
            onChange={(e) => updateField("zalo", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="whatsapp">WhatsApp</label>
          <input
            id="whatsapp"
            type="text"
            value={whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="telegram">Telegram</label>
          <input
            id="telegram"
            type="url"
            value={telegram}
            onChange={(e) => updateField("telegram", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="tiktok">TikTok</label>
          <input
            id="tiktok"
            type="url"
            value={tiktok}
            onChange={(e) => updateField("tiktok", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="instagram">Instagram</label>
          <input
            id="instagram"
            type="text"
            value={instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="youtube">YouTube</label>
          <input
            id="youtube"
            type="text"
            value={youtube}
            onChange={(e) => updateField("youtube", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="wechat">WeChat</label>
          <input
            id="wechat"
            type="text"
            value={wechat}
            onChange={(e) => updateField("wechat", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default SocialNetWork;
