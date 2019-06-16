module.exports = function (env /*, argv*/ ) {
    var prod = env.production === 1;

    return {
        mode: prod ? "production" : "development",
        devtool: prod ? "none" : "inline-source-map",
        entry: {
            // Entry point for main code
            bundle: "./src/main.ts"
            // Entry point for Chip8 worker
            //worker: "./src/chip8.ts"
        },
        output: {
            // It will create two bundles (based on entry names): bundle.js and worker.js
            filename: "[name].js"
        },
        resolve: {
            // Add `.ts` and `.tsx` as a resolvable extension.
            extensions: [".ts", ".tsx", ".js"]
        },
        module: {
            rules: [
                // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader"
                    //exclude: /node_modules/ // Is this necessary?
                }/*,
                {
                    test: /\.worker\.ts$/,
                    loader: "worker-loader",
                    options: { name: 'worker.js' }
                }*/
            ]
        }
        /*,
                optimization: {
                    // This avoids having duplicated modules if there are multiple bundles 
                    splitChunks: {
                        chunks: 'all'
                    }
                }*/
    };
};