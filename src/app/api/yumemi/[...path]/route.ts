// src/app/api/yumemi/[...path]/route.ts
// すべての外部APIアクセスを処理する単一の動的APIルート。

import { NextResponse, NextRequest } from 'next/server';

// 外部APIのURL
const YUMEMI_API_BASE_URL = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
// MLIT DATAPLATFORMのURL（RESASの代替として使用）
// MLIT DATAPLATFORMはキーが不要なため、APIキー関連のロジックは削除します。
const MLIT_API_BASE_URL = 'https://nlftp.mlit.go.jp/crd/das/api/v2/popdensity'; 


// 暫定的な型定義（プロジェクトの types.ts に依存）
type PopulationValue = { year: number; value: number };

// CORSヘッダー定義
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, Authorization',
};

/**
 * OPTIONSリクエスト（CORSプリフライト）を処理します。
 */
export async function OPTIONS() {
    return NextResponse.json(null, { status: 200, headers: CORS_HEADERS });
}


/**
 * GETリクエストを処理し、パスに基づいて都道府県一覧または人口データを取得します。
 * @param req NextRequestオブジェクト
 * @param context params: { path: string[] } を含むコンテキスト
 * @returns 処理結果のJSONレスポンス
 */
export async function GET(
  req: NextRequest, // NextRequestに修正
  context: { params: { path: string[] } } // 動的ルートの正しい型定義
) {
  const { searchParams } = new URL(req.url);
  const apiPath = context.params.path.join('/'); // 例: 'prefectures' または 'population'

  try {
    let externalEndpoint = '';
    let isMLITData = false;
    
    // --- 1. パスの分岐処理 ---
    if (apiPath === 'prefectures') {
      // 都道府県一覧の取得（Yumemi API）
      externalEndpoint = `${YUMEMI_API_BASE_URL}/api/v1/prefectures`;
      console.log(`[Proxy] Fetching prefectures from: ${externalEndpoint}`); // ログを追加
    } else if (apiPath === 'population') {
      // 人口データの取得（MLIT DATAPLATFORM）
      const prefCode = searchParams.get('prefCode');
      const prefName = searchParams.get('prefName');

      if (!prefCode || !prefName) {
        return NextResponse.json({ error: 'Prefecture code or name is missing.' }, { status: 400 });
      }
      
      // MLIT APIのGeoJSON取得エンドポイントを想定
      externalEndpoint = `${MLIT_API_BASE_URL}/features?prefCode=${prefCode}&limit=1000`; 
      isMLITData = true;
      console.log(`[Proxy] Fetching population from: ${externalEndpoint}`); // ログを追加

    } else {
      return NextResponse.json({ error: 'API path not found.' }, { status: 404 });
    }

    // --- 2. 外部APIへのリクエスト実行 ---
    const apiResponse = await fetch(externalEndpoint, {
        // MLIT DATAPLATFORMの場合はAcceptヘッダーを追加
        headers: isMLITData ? { 'Accept': 'application/json' } : {}
    });

    if (!apiResponse.ok) {
      console.error(`[Proxy] External API fetch failed for ${apiPath}: ${apiResponse.status} ${apiResponse.statusText}`);
      
      // 外部APIが返す可能性のあるテキストエラーも考慮してJSON解析を試みる
      let errorDetails = {};
      try {
          // JSON解析を試みる
          errorDetails = await apiResponse.json();
      } catch (e) {
          // JSON解析に失敗した場合、生のテキストを詳細情報として使用
          const rawText = await apiResponse.text();
          errorDetails = { message: `Non-JSON error response received from external API.`, rawText: rawText.substring(0, 100) + '...' };
      }
      
      // 外部APIのエラーを500としてラップし、詳細情報を付加して返す
      return NextResponse.json(
          { 
              error: `External API returned error for ${apiPath}: ${apiResponse.status}`, 
              details: errorDetails 
          },
          { status: 502, headers: CORS_HEADERS } // 外部APIエラーは502 Bad Gateway/Proxy Errorとして返すのが適切
      );
    }
    
    // 外部APIのJSONボディを取得
    const json = await apiResponse.json();

    // --- 3. MLITデータの整形処理 (人口データ) ---
    if (isMLITData) {
        const prefCode = Number(searchParams.get('prefCode'));
        const prefName = searchParams.get('prefName');
        
        if (!json.features || !Array.isArray(json.features)) {
            return NextResponse.json({ prefCode, prefName, data: [] });
        }

        const yearlyPopulationMap = new Map<number, number>();

        // GeoJSONデータを集計し、フロントエンドの形式に整形
        json.features.forEach((feature: any) => {
            const properties = feature.properties;
            // プロキシ側でフィルタリングし、整形
            if (properties.N03_001 === prefName) {
                const year = parseInt(properties.N03_007, 10);
                const value = parseInt(properties.N03_004, 10);
                
                if (!isNaN(year) && !isNaN(value)) {
                    const currentTotal = yearlyPopulationMap.get(year) || 0;
                    yearlyPopulationMap.set(year, currentTotal + value);
                }
            }
        });

        const populationValues: PopulationValue[] = [];
        yearlyPopulationMap.forEach((value, year) => {
            populationValues.push({ year, value });
        });
        populationValues.sort((a, b) => a.year - b.year);
        
        // 整形結果を返す
        return NextResponse.json({ prefCode, prefName, data: populationValues }, { headers: CORS_HEADERS });
    }
    
    // --- 4. 都道府県一覧の応答 (Yumemi API) ---
    // 取得したレスポンスをそのまま返す (JSON形式であることを確認済み)
    return NextResponse.json(json, {
        headers: CORS_HEADERS, // CORSヘッダーを適用
    });

  } catch (error) {
    console.error(`[Proxy] Critical Server-side processing error for ${apiPath}:`, error);
    // 処理中の予期せぬエラー（例: JSON解析失敗、ネットワークエラー）
    return NextResponse.json(
      { error: 'Internal Server Error during proxy execution.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}