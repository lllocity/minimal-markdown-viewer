# Step 07: MDViewerApp — onOpenURL 実装

## 目的

Google Drive（または Files アプリ）から `.md` ファイルを「アプリで開く」したときに、  
このアプリが URL を受け取り、`DocumentViewModel.load()` を呼び出す仕組みを実装する。

これが完成すると、アプリが「開く → Markdown が表示される」という一連の流れが動く。

---

## 背景知識

### onOpenURL とは

外部アプリから `file://` URL が渡されたときに呼ばれる SwiftUI のコールバック。

```swift
WindowGroup {
    ContentView()
}
.onOpenURL { url in
    // ここで受け取った URL を処理する
}
```

Google Drive で `.md` ファイルを「アプリで開く」すると、iOS がこのアプリを起動し、  
ファイルの一時コピーの URL（`file://...`）をこのコールバックに渡してくれる。

### @main と App プロトコル

```swift
@main
struct Minimal_Markdown_ViewerApp: App {
    var body: some Scene { ... }
}
```

- `@main`：アプリのエントリポイント（起動時に最初に実行される場所）を示す印
- `App` プロトコル：SwiftUI アプリの構造を定義するための仕組み
- `WindowGroup`：アプリのメインウィンドウを表すコンテナ

### @StateObject をここで持つ理由

`DocumentViewModel` はアプリ全体で1つだけ存在すればよい。  
`onOpenURL` が呼ばれたとき、同じ ViewModel に URL を渡す必要があるため、  
App レベルで生成して `ContentView` に渡す構造に変更する。

```
App（onOpenURL を受け取る）
 └─ viewModel（@StateObject でここで生成）
     └─ ContentView → MarkdownView（viewModel を受け取って表示）
```

---

## 実装するコード

**変更ファイル:** `Minimal_Markdown_ViewerApp.swift`

```swift
import SwiftUI

@main
struct Minimal_Markdown_ViewerApp: App {
    @StateObject private var viewModel = DocumentViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel)
        }
        .onOpenURL { url in
            viewModel.load(url: url)
        }
    }
}
```

**変更ファイル:** `ContentView.swift`（viewModel を外から受け取る形に変更）

```swift
import SwiftUI

struct ContentView: View {
    @ObservedObject var viewModel: DocumentViewModel

    var body: some View {
        MarkdownView(viewModel: viewModel)
    }
}

#Preview {
    ContentView(viewModel: DocumentViewModel())
}
```

### 変更のポイント

| 変更前 | 変更後 | 理由 |
|--------|--------|------|
| `ContentView` が `@StateObject` で生成 | `App` が `@StateObject` で生成 | `onOpenURL` と同じ viewModel を共有するため |
| `ContentView()` | `ContentView(viewModel: viewModel)` | 外から viewModel を渡す |

---

## 手順

### 1. docs を作成（このファイル）

### 2. Claude Code がファイルを更新する

- `Minimal_Markdown_ViewerApp.swift` を書き換える
- `ContentView.swift` の `@StateObject` を `@ObservedObject` に変更する

### 3. ビルド確認

▶ でビルドし「ファイルを開いてください」の待機画面が引き続き表示されれば OK。

### 4. シミュレーターで動作確認（Step 08 の前準備）

Files アプリに `.md` ファイルを配置して、このアプリで開いてみる。

---

## 確認ポイント

- [ ] ビルドエラーが出ない
- [ ] シミュレーターに待機画面が表示される
- [ ] （できれば）Files アプリから .md を開いて Markdown が表示される

---

## よくあるエラーと対処法

### 「Extra argument 'viewModel' in call」

- `ContentView` の引数定義が古いまま
- `ContentView.swift` の `@StateObject` → `@ObservedObject` への変更を確認する

### 「Value of type '...' has no member 'load'」

- `DocumentViewModel` の `load(url:)` が正しく実装されているか確認

---

## 学んだこと・メモ

- `onOpenURL` は SwiftUI の標準機能。URL Scheme や Universal Links でも同じコールバックが使われる
- Google Drive が渡す URL は `file://` の**一時コピー**。`startAccessingSecurityScopedResource()` が必要な理由はここにある
- `@StateObject` は「このViewが生成・所有する」、`@ObservedObject` は「外から受け取る」という意味の使い分けが重要
- App レベルで ViewModel を持つことで、アプリのどの画面からでも同じデータを参照できる

---

## 次のステップ

Step 07 完了後 → [Step 08: シミュレーターでのテスト](./step-08-simulator-test.md) へ