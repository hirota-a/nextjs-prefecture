// src/app/api/yumemi/[...path]/route.ts
// Next.jsのApp RouterでAPIプロキシとして機能します。

// Yumemi APIから都道府県一覧を取得し、CORSを回避してフロントエンドに返すAPIルート。

import { NextResponse } from 'next/server';

const YUMEMI_API_BASE_URL = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const PREFECTURES_ENDPOINT = '/api/v1/prefectures';

export async function GET() {
  const endpoint = `${YUMEMI_API_BASE_URL}${PREFECTURES_ENDPOINT}`;

  try {
    const apiResponse = await fetch(endpoint);

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch external prefectures data: ${apiResponse.statusText}` },
        { status: 502 }
      );
    }

    const json = await apiResponse.json();
    
    // 取得したレスポンスをそのままフロントエンドに返す
    return NextResponse.json(json);

  } catch (error) {
    console.error('Server-side error fetching prefectures:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during prefecture data retrieval.' },
      { status: 500 }
    );
  }
}