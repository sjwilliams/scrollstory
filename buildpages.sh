mkdir -p tmp
cd tmp
git clone --depth 1 https://github.com/sjwilliams/scrollstory.git
npm install
npm run build
mv build/* ../
cd ..
rm -rf tmp