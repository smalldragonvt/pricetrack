import React, { PureComponent } from "react"
import axios from "axios"
import { loadProgressBar } from 'axios-progress-bar'
import 'axios-progress-bar/dist/nprogress.css'

import Layout from "../components/layout"
import ListProduct from '../components/Block/ListProduct'
import Loading from '../components/Block/Loading'
import { withAuthentication } from '../components/Session'

loadProgressBar()

const DEFAULT_NUMBER_ITEMS = 15
const HEAD_LINE_PRICE_TRACKER = 'Theo dõi giá'

class IndexComponent extends PureComponent {
    constructor(props) {
        super(props)
        this.state = {
            urls: [],
            loading: false,
            error: false,
            
            orderBy: 'created_at', // [created_at, last_pull_at, price_change]
            desc: 'true',
            add_by: '',
            currentMode: 'last_added',
            limit: DEFAULT_NUMBER_ITEMS,
            next: false,
            latest_params: {}
        }
    }

    SORT_TEXT = {
        'price_change': 'Giá mới thay đổi',
        'last_added': 'Mới thêm',
    }
    orderByModes = () => Object.keys(this.SORT_TEXT)

    setOtherBy(mode) {
        let currentMode = mode 
        let { orderBy, desc, add_by } = this.state.orderBy

        if (mode === 'price_change') {
            orderBy = 'price_change_at'
            desc = 'true'
        } else if (mode === 'last_added') {
            orderBy = 'created_at'
            desc = 'true'
        } else if (mode === 'my_product') {
            add_by = ''
        }

        this.setState({ currentMode, orderBy, desc }, () => this._loadData())
    }

    async componentDidMount() {
        this._loadData()
    }

    async _fetchData(params) {
        let response = await axios.get('/api/listUrls', { params })
        let { data, headers } = response
        let nextStartAt = headers.nextstartat || null
        params['startAt'] = nextStartAt

        return { urls: data, next: nextStartAt, params }
    }

    async _loadData() {
        this.setState({ loading: true })

        let params = {
            orderBy: this.state.orderBy,
            desc: this.state.desc,
            limit: this.state.limit,
        }

        try {
            let { urls, next } = await this._fetchData(params)
            this.setState({ urls, next, loading: false, latest_params: params })
        } catch(err) {
            console.error(err)
            this.setState({ loading: false, error: true })
        }
    }

    async onClickLoadMore(params) {
        try {
            let { urls, next } = await this._fetchData(params)
            let new_urls = [...this.state.urls, ...urls]
            this.setState({ urls: new_urls, next })
        } catch(err) {
            console.error(err)
            this.setState({ loading: false, error: true })
        }
    }

    renderListUrl() {
        if (this.state.loading) return <Loading />
        if (this.state.error) return 'Some thing went wrong'

        return <ListProduct urls={this.state.urls}
                            loadMore={this.state.next} 
                            onClickLoadMore={
                                () => this.onClickLoadMore(this.state.latest_params)
                            } />
    }

    sortControl() {
        let controls = []
        for (let mode of this.orderByModes()) {
            controls.push(
                <span className="text-white mr-2 btn" 
                    key={mode}
                    onClick={() => this.setOtherBy(mode)}
                    style={{ fontWeight: this.state.currentMode === mode ? 700 : 300 }}>
                    {this.SORT_TEXT[mode]}
                </span>
            )
        }

        return controls
    }

    render() {
        return (
            <Layout>
                <div className="d-flex align-items-center p-3 my-3 text-white-50 rounded shadow-sm" style={{background: '#03A9F4'}}>
                    <div className="d-flex flex-grow-1 align-items-center">
                        <img className="mr-3" src="http://getbootstrap.com/docs/4.2/assets/brand/bootstrap-outline.svg" alt="" width="48" height="48" />
                        <div className="lh-100">
                          <h6 className="mb-0 text-white lh-100">{HEAD_LINE_PRICE_TRACKER}</h6>
                          <small>beta</small>
                        </div>
                    </div>

                    <div className="lh-100 mr-0 p-2 bd-highlight text-white">
                        {this.sortControl()}
                   </div>
                </div>

                <div className="my-3 p-3 bg-white rounded shadow-sm" id="listUrls">
                    {this.renderListUrl()}
                </div>
            </Layout>
        )
    }
}

export default withAuthentication(IndexComponent)