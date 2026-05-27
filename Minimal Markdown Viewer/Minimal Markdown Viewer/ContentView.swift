//
//  ContentView.swift
//  Minimal Markdown Viewer
//
//  Created by Yusuke Yoshino on 2026/05/26.
//

import SwiftUI

struct ContentView: View {
    @StateObject var viewModel = DocumentViewModel()

    var body: some View {
        MarkdownView(viewModel: viewModel)
    }
}

#Preview {
    ContentView()
}
