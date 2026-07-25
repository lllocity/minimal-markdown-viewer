# Step 07b: DocumentViewModel ユニットテスト

## 目的

`DocumentViewModel.load()` のロジックが正しく動くことをコードで自動検証する。  
手動での動作確認と組み合わせることで、将来コードを変更したときの品質を担保できる。

---

## 背景知識

### ユニットテストとは

コードの最小単位（関数・クラス）が期待どおりに動くかを自動で検証する仕組み。

```
手動テスト：アプリを起動して目で確認 → 毎回手間がかかる
ユニットテスト：コードで検証 → ▶ 一発で全ケースを確認できる
```

### XCTest とは

Apple 公式のテストフレームワーク。Xcode に組み込まれている。

```swift
func testLoadValidMarkdown() throws {
    // 準備
    let url = try createTempFile(content: "# Hello", name: "test.md")

    // 実行
    viewModel.load(url: url)

    // 検証
    XCTAssertEqual(viewModel.markdownText, "# Hello")
    XCTAssertNil(viewModel.errorMessage)
}
```

- `XCTAssertEqual(a, b)`：a と b が等しければ合格
- `XCTAssertNil(x)`：x が nil であれば合格
- `XCTAssertNotNil(x)`：x が nil でなければ合格

### @testable import とは

テストターゲットからアプリ本体のコードにアクセスするための宣言。

```swift
@testable import Minimal_Markdown_Viewer
```

通常は `internal`（同モジュール内のみ）なクラスや関数にテストからアクセスできるようになる。

---

## テストケース一覧

| テスト名 | 入力 | 期待する結果 |
|---------|------|------------|
| `testLoadValidMarkdown` | 正常な .md ファイル | `markdownText` にセット、`errorMessage` が nil |
| `testFileNameExtraction` | `my-note.md` | `fileName == "my-note.md"` |
| `testLoadEmptyFile` | 空ファイル | `errorMessage == "ファイルが空です"` |
| `testLoadNonExistentFile` | 存在しないパス | `errorMessage` に「ファイルを開けませんでした」が含まれる |

---

## 手順

### 1. Xcode でテストターゲットを追加

プロジェクト作成時に Testing System を「None」にしたため、後から追加が必要。

1. Xcode メニュー → **「File」→「New」→「Target...」**
2. **「Unit Testing Bundle」** を選択 → 「Next」
3. 設定：
   - Product Name: `Minimal Markdown ViewerTests`
   - Target to be Tested: `Minimal Markdown Viewer`
4. 「Finish」

左サイドバーに `Minimal Markdown ViewerTests` フォルダが追加されれば完了。

### 2. Claude Code がテストファイルをディスクに書き込む

`DocumentViewModelTests.swift` を所定の場所に作成する。

### 3. Xcode でテストファイルをプロジェクトに追加

前回（Step 05）と同様：
- テストターゲットフォルダを右クリック → 「Add Files...」
- または自動認識（`?` マークが出れば認識済み）

### 4. テスト実行

**⌘+U** でテストを実行。全テストが緑（合格）になれば完了。

---

## テストコード

**ファイル:** `Minimal Markdown ViewerTests/DocumentViewModelTests.swift`

```swift
import XCTest
@testable import Minimal_Markdown_Viewer

final class DocumentViewModelTests: XCTestCase {

    var viewModel: DocumentViewModel!

    override func setUp() {
        super.setUp()
        viewModel = DocumentViewModel()
    }

    override func tearDown() {
        viewModel = nil
        // 一時ファイルのクリーンアップ
        let tempDir = FileManager.default.temporaryDirectory
        try? FileManager.default.removeItem(at: tempDir.appendingPathComponent("test.md"))
        try? FileManager.default.removeItem(at: tempDir.appendingPathComponent("empty.md"))
        try? FileManager.default.removeItem(at: tempDir.appendingPathComponent("my-note.md"))
        super.tearDown()
    }

    // 正常な Markdown ファイルの読み込み
    func testLoadValidMarkdown() throws {
        let content = "# Hello\n\nThis is **markdown**."
        let url = try createTempFile(content: content, name: "test.md")

        viewModel.load(url: url)

        XCTAssertEqual(viewModel.markdownText, content)
        XCTAssertNil(viewModel.errorMessage)
    }

    // ファイル名が正しく取得される
    func testFileNameExtraction() throws {
        let url = try createTempFile(content: "# Test", name: "my-note.md")

        viewModel.load(url: url)

        XCTAssertEqual(viewModel.fileName, "my-note.md")
    }

    // 空ファイルのエラーハンドリング
    func testLoadEmptyFile() throws {
        let url = try createTempFile(content: "", name: "empty.md")

        viewModel.load(url: url)

        XCTAssertEqual(viewModel.errorMessage, "ファイルが空です")
        XCTAssertTrue(viewModel.markdownText.isEmpty)
    }

    // 存在しないファイルのエラーハンドリング
    func testLoadNonExistentFile() {
        let url = URL(fileURLWithPath: "/nonexistent/path/file.md")

        viewModel.load(url: url)

        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertTrue(viewModel.errorMessage!.contains("ファイルを開けませんでした"))
    }

    // ヘルパー：一時ファイルを作成して URL を返す
    private func createTempFile(content: String, name: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        try content.write(to: url, atomically: true, encoding: .utf8)
        return url
    }
}
```

---

## 確認ポイント

- [ ] テストターゲット `Minimal Markdown ViewerTests` が Xcode に追加された
- [ ] `DocumentViewModelTests.swift` が左サイドバーに表示されている
- [ ] **⌘+U** で全テストが緑（合格）になる

---

## よくあるエラーと対処法

### 「No such module 'Minimal_Markdown_Viewer'」

- `@testable import Minimal_Markdown_Viewer` のモジュール名が違う
- Xcode でプロジェクト名のアンダースコア変換を確認（スペース → `_`）

### テストターゲットで「DocumentViewModel が見つからない」

- テストターゲットの「Target Membership」に `Minimal Markdown Viewer` が含まれているか確認

### ⌘+U を押してもテストが実行されない

- テストターゲットが選択されているか確認（上部の実行ターゲット欄）

---

## 学んだこと・メモ

- ユニットテストは「ロジック層（ViewModel）」に書くのが効果的。View のテストは複雑になりがち
- `FileManager.default.temporaryDirectory` は読み書き自由な一時ディレクトリ。テストに最適
- `setUp` / `tearDown`：各テストの前後に実行される準備・後処理。テスト間の依存をなくす
- `@testable import`：テスト対象アプリのコードに「テスト用の特別なアクセス権」でアクセスする

---

## 次のステップ

Step 07b 完了後 → [Step 08: シミュレーターでのテスト](./step-08-simulator-test.md) へ
