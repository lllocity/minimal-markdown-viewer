# Step 06: MarkdownView 実装

## 目的

Markdown テキストを受け取り、画面にレンダリングして表示する View を実装する。  
`swift-markdown-ui` の `Markdown` コンポーネントを使うことで、  
見出し・太字・コードブロック・リストなどが自動でスタイリングされる。

---

## 背景知識

### SwiftUI の View とは

SwiftUI では画面の部品を `View` プロトコルに準拠した `struct` として定義する。

```swift
struct MarkdownView: View {
    var body: some View { ... }  // ← ここに表示内容を書く
}
```

### @ObservedObject とは

Step 05 で作った `DocumentViewModel` を View で受け取るための宣言。

```swift
@ObservedObject var viewModel: DocumentViewModel
```

- `@ObservedObject`：外から渡される ViewModel を監視する
- `viewModel.markdownText` が変わると自動で画面が更新される

（`@StateObject` との違い：View が ViewModel を自分で生成するなら `@StateObject`、外から受け取るなら `@ObservedObject`）

### NavigationStack とは

画面上部にナビゲーションバー（タイトルが表示される帯）を追加する SwiftUI のコンテナ。  
`.navigationTitle(...)` でファイル名を表示できる。

---

## 実装する画面の状態

| 状態 | 表示内容 |
|------|---------|
| ファイル未読み込み | 「ファイルを開いてください」（待機画面） |
| エラー発生 | エラーアイコン + エラーメッセージ（中央表示） |
| 読み込み成功 | Markdown をレンダリングして縦スクロール表示 |

---

## 実装するコード

**ファイル:** `Minimal Markdown Viewer/MarkdownView.swift`（新規作成）

```swift
import SwiftUI
import MarkdownUI

struct MarkdownView: View {
    @ObservedObject var viewModel: DocumentViewModel

    var body: some View {
        NavigationStack {
            Group {
                if let error = viewModel.errorMessage {
                    // エラー状態
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                } else if viewModel.markdownText.isEmpty {
                    // 待機状態（ファイル未読み込み）
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("ファイルを開いてください")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                } else {
                    // コンテンツ表示状態
                    ScrollView {
                        Markdown(viewModel.markdownText)
                            .markdownTheme(.gitHub)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                    }
                }
            }
            .navigationTitle(viewModel.fileName.isEmpty ? "Markdown Viewer" : viewModel.fileName)
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
```

### コードの解説

| 部分 | 説明 |
|------|------|
| `import MarkdownUI` | swift-markdown-ui のモジュール名。`import SwiftMarkdownUI` ではない |
| `Markdown(viewModel.markdownText)` | Markdown 文字列をレンダリングするコンポーネント |
| `.markdownTheme(.gitHub)` | GitHub 風のスタイル。コードブロックにグレー背景がつく |
| `ScrollView` | 縦スクロール対応 |
| `.navigationTitle(...)` | ナビゲーションバーにファイル名を表示 |
| `.navigationBarTitleDisplayMode(.inline)` | タイトルを小さく中央に表示（大きく表示したい場合は `.large`） |
| `Group { if ... else if ... else ... }` | 状態によって表示内容を切り替える |

---

## 手順

### 1. Claude Code がファイルをディスクに書き込む

`MarkdownView.swift` を Claude Code が直接ディスクに作成する。

### 2. Xcode でプロジェクトに追加する（前回と同じ手順）

1. Xcode 左サイドバーの **`Minimal Markdown Viewer`（青いフォルダ）を右クリック**
2. **「Add Files to "Minimal Markdown Viewer"...」**
3. `MarkdownView.swift` を選んで **「Add」**

※ Xcode 26 では自動認識される場合もある（前回の `DocumentViewModel.swift` と同様）

### 3. ContentView.swift を MarkdownView に差し替える

`ContentView.swift` の中身を `MarkdownView` を呼び出す形に書き換える：

```swift
import SwiftUI

struct ContentView: View {
    @StateObject var viewModel = DocumentViewModel()

    var body: some View {
        MarkdownView(viewModel: viewModel)
    }
}
```

### 4. ビルド確認

▶ でビルドし、シミュレーターに「ファイルを開いてください」の画面が表示されれば成功。

---

## 確認ポイント

- [ ] `MarkdownView.swift` が Xcode の左サイドバーに表示されている
- [ ] ビルドエラーが出ない
- [ ] シミュレーターで「ファイルを開いてください」の待機画面が表示される

---

## よくあるエラーと対処法

### 「No such module 'MarkdownUI'」

- swift-markdown-ui が正しく追加されていない
- Xcode メニュー → File → Packages → Resolve Package Versions を試みる

### 「Cannot find 'Markdown' in scope」

- `import MarkdownUI` が抜けている（`import SwiftUI` だけでは不足）

### 「Type 'MarkdownView' does not conform to protocol 'View'」

- `body` プロパティの実装を確認する

---

## 学んだこと・メモ

- `swift-markdown-ui` のモジュール名は `MarkdownUI`（import 時に注意）
- `.markdownTheme(.gitHub)` が最もバランスの良いデフォルト。他に `.basic`・`.docC` がある
- SwiftUI の View は「状態に応じて何を表示するか」を宣言的に書く。if/else で状態分岐するのが基本パターン
- `@StateObject` vs `@ObservedObject`：生成元が自分なら `@StateObject`、外から受け取るなら `@ObservedObject`

---

## 次のステップ

Step 06 完了後 → [Step 07: MDViewerApp の onOpenURL 実装](./step-07-app-entry.md) へ
