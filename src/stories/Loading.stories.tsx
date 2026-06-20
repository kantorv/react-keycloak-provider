import * as React from 'react';
import type { Meta, StoryObj } from "@storybook/react";
//import {  ErrorAlert } from "..";


//import { default as LoadingScreenSample } from '../lib/keycloak-provider/Loading'
const LoadingScreenSample = ()=>(<div>Loading</div>)



const meta: Meta<typeof LoadingScreenSample> = {
	component: LoadingScreenSample,
};

export default meta;
type Story = StoryObj<typeof LoadingScreenSample>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */



export const Single: Story = {
	render: () =>
		<LoadingScreenSample />

};
