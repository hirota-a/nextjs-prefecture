// src/components/PrefectureList/index.tsx
// 都道府県のチェックボックスリストを表示するUIコンポーネントです。

import React, { memo } from 'react';
import { Prefecture, SelectedPrefectures } from '../../types';
import styles from './index.module.css';

interface PrefectureListProps {
  prefectures: Prefecture[];
  selectedPrefs: SelectedPrefectures;
  onToggle: (prefCode: number, isChecked: boolean, prefName: string) => void;
}

/**
 * 都道府県一覧をチェックボックス形式で表示するコンポーネント
 * @param prefectures 全都道府県のリスト
 * @param selectedPrefs 選択状態のマップ
 * @param onToggle チェックボックス切り替え時のコールバック
 */
export const PrefectureList: React.FC<PrefectureListProps> = memo(
  ({ prefectures, selectedPrefs, onToggle }) => {
    
    // データがない場合のローディング表示は親コンポーネントで行うため、ここでは簡易的な表示に留める

    return (
      <div className={styles.prefectureListContainer}>
        <h2 className={styles.title}>都道府県一覧</h2>
        <div className={styles.checkboxGrid}>
          {prefectures.map(pref => (
            <label className={styles.checkboxItem} key={pref.prefCode}>
              <input
                type="checkbox"
                // 選択状態を反映
                checked={selectedPrefs[pref.prefCode] || false}
                // 状態切り替え時のハンドラー
                onChange={e =>
                  onToggle(
                    pref.prefCode,
                    e.target.checked,
                    pref.prefName,
                  )
                }
              />
              <span className={styles.label}>{pref.prefName}</span>
            </label>
          ))}
        </div>
      </div>
    );
  },
);

PrefectureList.displayName = 'PrefectureList';
