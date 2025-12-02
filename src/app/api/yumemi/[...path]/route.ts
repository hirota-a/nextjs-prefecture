// src/app/api/yumemi/[...path]/route.ts
// Next.jsのApp RouterでAPIプロキシとして機能します。

// MLIT DATAPLATFORM（国土交通データプラットフォーム）のベースURL
// 国土数値情報 人口集中地区データのエンドポイントを直接指定
const MLIT_API_BASE_URL = 'https://api.mlit.go.jp/datacore/opendata/v1/mlit/np-2410-pop_concentration_area';

/**
 * Next.js API Routeとして、MLIT DATAPLATFORMへのリクエストを代理転送するプロキシです。
 * 必要なAPIキーをサーバー側でのみ使用し、クライアントからの露出を防ぎます。
 */
export async function GET(
  req: Request,
  context: { params: { path: string[] } }
) {
  // 環境変数からMLIT APIキーを取得（RESAS_API_KEYを流用）
  const apiKey = process.env.RESAS_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ message: 'API Key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // クライアントから渡されたパスとクエリパラメータを取得（今回は使用しないが、構造は維持）
  const searchParams = new URL(req.url).searchParams.toString();

  // MLIT APIの完全なURLを構築 (パスを無視し、ベースエンドポイントに直接接続)
  const mlitUrl = `${MLIT_API_BASE_URL}?${searchParams}`;

  try {
    // MLIT DATAPLATFORMへリクエストを送信
    const mlitResponse = await fetch(mlitUrl, {
      headers: {
        // MLIT DATAPLATFORMでは、キーを`apikey`クエリパラメータまたは`X-API-KEY`ヘッダーで指定
        'X-API-KEY': apiKey, // サーバー側でのみAPIキーを使用
        'Accept': 'application/json' // JSON形式でレスポンスを要求
      },
      // Next.jsのキャッシュ設定を上書き
      cache: 'no-store',
    });

    // MLIT APIからのレスポンスをそのままクライアントに返す
    const data = await mlitResponse.json();

    if (!mlitResponse.ok) {
      console.error('MLIT API Error:', data);
      return new Response(JSON.stringify(data), {
        status: mlitResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 成功レスポンスを返す
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
