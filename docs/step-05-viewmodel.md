# Step 05: DocumentViewModel 実装

## 目的

Google Drive から受け取った `.md` ファイルの URL を読み込み、テキストとして公開するクラスを実装する。  
SwiftUI の View はこのクラスを通じてファイルの中身を受け取る。

---

## 背景知識

### ViewModel とは（MVVM パターン）

このアプリは **MVVM（Model-View-ViewModel）** という設計パターンに従っている。

| 役割 | ファイル | 説明 |
|------|---------|------|
| View | `ContentView.swift` → `MarkdownView.swift` | 画面表示だけを担当 |
| **ViewModel** | **`DocumentViewModel.swift`** | データの取得・加工を担当 |
| Model | （今回は特になし） | データ構造の定義 |

View が直接ファイルを読みに行くのではなく、ViewModel に任せることで責務が分離される。  
→ コードが読みやすく、テストしやすくなる。

### ObservableObject と @Published

```swift
class DocumentViewModel: ObservableObject {
    @Published var markdownText: String = ""
}
```

- `ObservableObject`：SwiftUI の View が「このクラスの変化を監視する」ための宣言
- `@Published`：この変数が変わったとき、自動で View に通知する印

View 側で `@StateObject var viewModel = DocumentViewModel()` と書くと、  
`markdownText` が変わるたびに自動で画面が再描画される。

### Security-Scoped Resource とは

他のアプリ（Google Drive 等）から渡されたファイルの URL は、セキュリティ上の制限がある。  
アクセスする前に「使います」と宣言し、終わったら「終わりました」と返す必要がある。

```swift
let accessing = url.startAccessingSecurityScopedResource()  // 「使います」
defer {
    if accessing { url.stopAccessingSecurityScopedResource() }  // 「終わりました」
}
```

`defer` は関数を抜けるときに**必ず**実行されるブロック。  
エラーが起きても確実にリソースを解放できる。

---

## 実装するコード

**ファイル:** `Minimal Markdown Viewer/DocumentViewModel.swift`

```swift
import Foundation

class DocumentViewModel: ObservableObject {
    @Published var markdownText: String = ""
    @Published var fileName: String = ""
    @Published var errorMessage: String? = nil

    func load(url: URL) {
        fileName = url.lastPathComponent

        let accessing = url.startAccessingSecurityScopedResource()
        defer {
            if accessing {
                url.stopAccessingSecurityScopedResource()
            }
        }

        do {
            let data = try Data(contentsOf: url)
            guard let text = String(data: data, encoding: .utf8) else {
                errorMessage = "文字コードを読み取れませんでした（UTF-8 のみ対応）"
                return
            }
            guard !text.isEmpty else {
                errorMessage = "ファイルが空です"
                return
            }
            markdownText = text
            errorMessage = nil
        } catch {
            errorMessage = "ファイルを開けませんでした: \(error.localizedDescription)"
        }
    }
}
```

### エラーハンドリング一覧

| シナリオ | `errorMessage` の内容 |
|---------|----------------------|
| ファイルが空 | 「ファイルが空です」 |
| UTF-8 以外の文字コード | 「文字コードを読み取れませんでした（UTF-8 のみ対応）」 |
| その他の読み込みエラー | 「ファイルを開けませんでした: （詳細）」 |

---

## 手順

### 1. Claude Code がファイルをディスクに書き込む

`DocumentViewModel.swift` は Claude Code が直接ディスクに作成する。

### 2. Xcode でプロジェクトに追加する

Xcode はディスク上のファイルを自動では認識しない。  
**プロジェクトへの登録** という一手間が必要。

1. Xcode 左サイドバーの **`Minimal Markdown Viewer`（青いフォルダ）を右クリック**
2. **「Add Files to "Minimal Markdown Viewer"...」** を選択
3. `DocumentViewModel.swift` を選んで **「Add」**
4. 左サイドバーに `DocumentViewModel.swift` が表示されれば完了

### 3. ビルド確認

▶ ボタンでビルドが通ることを確認する。

---

## 確認ポイント

- [ ] `DocumentViewModel.swift` が Xcode の左サイドバーに表示されている
- [ ] ▶ ボタンでビルドエラーが出ない

---

## よくあるエラーと対処法

### 「Cannot find type 'DocumentViewModel' in scope」

- ファイルがプロジェクトに追加されていない
- 「Add Files to Project...」を再度試みる

### 「Value of type 'DocumentViewModel' has no member 'load'」

- ファイルは追加されているが中身が違う
- `DocumentViewModel.swift` の内容を確認する

---

## 学んだこと・メモ

- **MVVM パターン**：View はデータの取得方法を知らなくていい。ViewModel が責任を持つ
- **`@Published`**：変数の変更を View に自動通知する仕組み
- **`defer`**：関数の終わりに必ず実行される処理。リソース解放に最適
- **Security-Scoped Resource**：外部アプリから渡されたファイルにアクセスするための iOS のセキュリティ機構
- Claude Code がディスクに書いたファイルは Xcode の「Add Files to Project...」で登録が必要

---

## 次のステップ

Step 05 完了後 → [Step 06: MarkdownView 実装](./step-06-markdown-view.md) へ
