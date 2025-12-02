// src/app/page.tsx
// アプリケーションのメインコンポーネントです。ここでデータのロードとコンポーネントの連携を行います。

'use client';

import React, { useEffect, useState } from 'react';
import { Prefecture } from '../types';
import { fetchPrefectures } from '../lib/api';
import { usePopulationData } from '../hooks/usePopulationData';
import { PrefectureList } from '../components/PrefectureList';
import { PopulationGraph } from '../components/PopulationGraph';
import styles from './page.module.css';

/**
 * アプリケーションのメインページコンポーネント
 */
export default function Home() {
  const [allPrefectures, setAllPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. 都道府県一覧の取得 (初回ロード時のみ)
  useEffect(() => {
    const loadPrefectures = async () => {
      try {
        const prefs = await fetchPrefectures();
        if (prefs.length === 0) {
            // エラーは発生しなくても、データが空の場合はメッセージを表示
            // RESASの都道府県一覧APIは利用可能と仮定
        }
        setAllPrefectures(prefs);
      } catch (err) {
        console.error('都道府県データの取得に失敗しました:', err);
        setError('都道府県データの読み込み中にエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    loadPrefectures();
  }, []);

  // 2. カスタムフックによる人口データ管理
  const {
    selectedPrefs,
    currentPopulationType,
    handlePrefectureToggle,
    setCurrentPopulationType,
    chartSeries,
  } = usePopulationData(allPrefectures);

  // ローディング/エラー表示
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>都道府県データを読み込み中です...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>エラー</h2>
        <p>{error}</p>
        <p>ブラウザをリロードするか、時間をおいて再度お試しください。</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 3. 都道府県リストコンポーネント */}
      <section className={styles.prefectureSection}>
        <PrefectureList
          prefectures={allPrefectures}
          selectedPrefs={selectedPrefs}
          onToggle={handlePrefectureToggle}
        />
      </section>

      {/* 4. 人口構成グラフコンポーネント */}
      <section className={styles.graphSection}>
        <PopulationGraph
          chartSeries={chartSeries}
          currentPopulationType={currentPopulationType}
          setCurrentPopulationType={setCurrentPopulationType}
        />
      </section>
    </div>
  );
}